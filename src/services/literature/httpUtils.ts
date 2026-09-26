/**
 * HTTP Utilities for Literature Services
 * 
 * Provides robust fetch execution with configurable timeouts, abort signal coordination,
 * external API rate limit handling (Retry-After parsing, proactive pacing), and exponential backoff.
 */

import { LiteratureErrorSource, LiteratureApiError, RateLimitError, RemoteServerError, TimeoutError } from './errors';
import { literatureRateLimiter } from './rateLimiter';

export interface FetchWithRetryOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  retryOnStatus?: number[];
  source?: LiteratureErrorSource;
  /** Max seconds from Retry-After header that we are willing to wait synchronously inside retries */
  maxRetryAfterWaitSeconds?: number;
}

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds default for scientific APIs

/**
 * Parses the HTTP Retry-After header (either integer seconds or HTTP-date string)
 */
export function parseRetryAfter(header: string | null | undefined): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();

  // 1. Integer seconds (e.g. "5", "120")
  if (/^\d+$/.test(trimmed)) {
    const parsed = parseInt(trimmed, 10);
    return !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
  }

  // 2. HTTP-Date (e.g. "Wed, 21 Oct 2026 07:28:00 GMT")
  const parsedDate = Date.parse(trimmed);
  if (!isNaN(parsedDate)) {
    const diffSec = Math.ceil((parsedDate - Date.now()) / 1000);
    return Math.max(1, diffSec);
  }

  return undefined;
}

/**
 * Parses rate limit reset headers from various external academic APIs:
 * - standard 'retry-after'
 * - 'ratelimit-reset' / 'x-ratelimit-reset' (seconds or future unix timestamp)
 * - 'x-rate-limit-interval' (e.g. '1s', '60s')
 */
export function parseRateLimitReset(headers: Headers): number | undefined {
  // 1. Standard Retry-After
  const retryAfter = parseRetryAfter(headers.get('retry-after'));
  if (retryAfter !== undefined) return retryAfter;

  // 2. RateLimit-Reset / X-RateLimit-Reset
  const resetHeader = headers.get('ratelimit-reset') || headers.get('x-ratelimit-reset');
  if (resetHeader) {
    const val = parseFloat(resetHeader.trim());
    if (!isNaN(val) && val > 0) {
      if (val > 1000000000) {
        // Unix timestamp in seconds (or milliseconds if > 1e11)
        const nowSec = Date.now() / 1000;
        const targetSec = val > 1e11 ? val / 1000 : val;
        const diff = Math.ceil(targetSec - nowSec);
        return Math.max(1, diff);
      }
      return Math.max(1, Math.ceil(val));
    }
  }

  // 3. X-Rate-Limit-Interval (CrossRef specific header: e.g. "1s", "10s", "1m")
  const intervalHeader = headers.get('x-rate-limit-interval');
  if (intervalHeader) {
    const match = intervalHeader.trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|ms)?$/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = (match[2] || 's').toLowerCase();
      if (unit === 's') return Math.max(1, Math.ceil(num));
      if (unit === 'm') return Math.max(1, Math.ceil(num * 60));
      if (unit === 'ms') return Math.max(1, Math.ceil(num / 1000));
    }
  }

  return undefined;
}

export async function fetchWithRetryAndTimeout(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const envTimeout = process.env.LITERATURE_API_TIMEOUT_MS
    ? parseInt(process.env.LITERATURE_API_TIMEOUT_MS, 10)
    : undefined;

  const {
    timeoutMs = (envTimeout && !isNaN(envTimeout)) ? envTimeout : DEFAULT_TIMEOUT_MS,
    retries = 2,
    backoffMs = 500,
    maxBackoffMs = 4000,
    retryOnStatus = [408, 429, 500, 502, 503, 504],
    source = 'literature_service',
    maxRetryAfterWaitSeconds = 12,
    signal: userSignal,
    ...fetchInit
  } = options;

  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let timedOut = false;

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort(new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`, source, timeoutMs));
      }, timeoutMs);
      timeoutId.unref?.();
    }

    const onUserAbort = () => {
      controller.abort(userSignal?.reason);
    };

    if (userSignal) {
      if (userSignal.aborted) {
        if (timeoutId) clearTimeout(timeoutId);
        throw userSignal.reason || new Error('Aborted');
      }
      userSignal.addEventListener('abort', onUserAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      // Handle 429 Rate Limiting
      if (response.status === 429) {
        const retryAfterSeconds = parseRateLimitReset(response.headers);
        const pauseDurationMs = (retryAfterSeconds ?? 2) * 1000;

        // Inform domain rate limiter to pause further outgoing requests
        if (source !== 'literature_service') {
          literatureRateLimiter.pause(source, pauseDurationMs);
        }

        // Retry if within retry budget and retry-after is reasonable
        const canWaitRetryAfter = retryAfterSeconds === undefined || retryAfterSeconds <= maxRetryAfterWaitSeconds;
        if (attempt <= retries && canWaitRetryAfter) {
          const delay = retryAfterSeconds !== undefined
            ? retryAfterSeconds * 1000
            : Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1) + Math.random() * 200);

          console.warn(`[${source}] Received HTTP 429 from ${url}. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms (Retry-After: ${retryAfterSeconds ?? 'none'})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new RateLimitError(
          source,
          `${source} API rate limit exceeded (HTTP 429)${retryAfterSeconds ? `. Retry after ${retryAfterSeconds}s` : ''}`,
          retryAfterSeconds
        );
      }

      // Check for retriable HTTP status codes (transient 5xx, 408)
      if (retryOnStatus.includes(response.status) && attempt <= retries) {
        const delay = Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1) + Math.random() * 100);
        console.warn(`[${source}] Received HTTP ${response.status} from ${url}. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If response is not ok and retries are exhausted:
      if (!response.ok) {
        // HTTP 408 or 504 are timeout errors
        if (response.status === 408 || response.status === 504) {
          throw new TimeoutError(
            `${source} API request timed out (HTTP ${response.status} ${response.statusText})`,
            source,
            timeoutMs
          );
        }

        if (response.status >= 500) {
          throw new RemoteServerError(
            `${source} API remote server error: HTTP ${response.status} ${response.statusText}`,
            response.status,
            source
          );
        }

        if (response.status === 403 || response.status === 400) {
          // Some APIs (like NCBI) return 400 or 403 when rate limit is exceeded with error body
          try {
            const errorClone = response.clone();
            const text = await errorClone.text();
            if (text.toLowerCase().includes('rate limit') || text.toLowerCase().includes('too many requests')) {
              if (source !== 'literature_service') {
                literatureRateLimiter.pause(source, 3000);
              }
              if (attempt <= retries) {
                const delay = Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1) + 500);
                console.warn(`[${source}] Received HTTP ${response.status} (rate limited) from ${url}. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
              }
              throw new RateLimitError(
                source,
                `${source} API rate limit exceeded (HTTP ${response.status}): ${text.slice(0, 150)}`
              );
            }
          } catch (peekErr: any) {
            if (peekErr instanceof RateLimitError) throw peekErr;
          }
        }
      }

      return response;
    } catch (err: any) {
      // Re-throw if cancelled by user
      if (userSignal?.aborted) {
        throw userSignal.reason || err;
      }

      // If already a categorized LiteratureApiError, rethrow
      if (err instanceof RateLimitError || err instanceof TimeoutError || err instanceof RemoteServerError) {
        throw err;
      }

      // Handle timeout
      const isTimeout =
        timedOut ||
        err?.name === 'TimeoutError' ||
        err?.name === 'AbortError' && timedOut ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        err?.message?.toLowerCase().includes('timed out');

      if (isTimeout) {
        if (attempt <= retries) {
          const delay = Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1));
          console.warn(`[${source}] Request to ${url} timed out. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`, source, timeoutMs, err);
      }

      // Handle network errors (connection dropped, DNS lookup failed, fetch failed)
      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ECONNREFUSED' ||
        err?.message?.includes('fetch failed');

      if (attempt <= retries && isNetworkError) {
        const delay = Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1));
        console.warn(`[${source}] Network error connecting to ${url}: ${err.message}. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (userSignal) {
        userSignal.removeEventListener('abort', onUserAbort);
      }
    }
  }
}
