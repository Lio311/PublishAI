/**
 * HTTP Utilities for Literature Services
 * 
 * Provides robust fetch execution with configurable timeouts, abort signal coordination,
 * and retry mechanisms with exponential backoff for transient server errors and rate limits.
 */

import { LiteratureApiError, RateLimitError, RemoteServerError, TimeoutError } from './errors';

export interface FetchWithRetryOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  retryOnStatus?: number[];
  source?: 'pubmed' | 'crossref' | 'literature_service';
}

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds default for scientific APIs

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
    maxBackoffMs = 3000,
    retryOnStatus = [429, 502, 503, 504],
    source = 'literature_service',
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

      // Check for retriable HTTP status codes
      if (retryOnStatus.includes(response.status) && attempt <= retries) {
        let delay = Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1) + Math.random() * 100);

        // Respect 429 Retry-After header if present
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('retry-after');
          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds) && parsedSeconds > 0 && parsedSeconds <= 10) {
              delay = parsedSeconds * 1000;
            }
          }
        }

        console.warn(`[${source}] Received HTTP ${response.status} from ${url}. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If response is not ok and retries are exhausted:
      if (!response.ok) {
        if (response.status === 429) {
          let retryAfter: number | undefined;
          const retryAfterHeader = response.headers.get('retry-after');
          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed)) retryAfter = parsed;
          }
          throw new RateLimitError(
            source === 'pubmed' || source === 'crossref' ? source : 'crossref',
            `${source} API rate limit exceeded (HTTP 429)`,
            retryAfter
          );
        }

        if (response.status >= 500) {
          throw new RemoteServerError(
            `${source} API remote server error: HTTP ${response.status} ${response.statusText}`,
            response.status,
            source === 'pubmed' || source === 'crossref' ? source : 'crossref'
          );
        }
      }

      return response;
    } catch (err: any) {
      // Re-throw if cancelled by user
      if (userSignal?.aborted) {
        throw userSignal.reason || err;
      }

      // Handle timeout
      if (timedOut || err?.name === 'TimeoutError' || (err instanceof TimeoutError)) {
        if (attempt <= retries) {
          const delay = Math.min(maxBackoffMs, backoffMs * Math.pow(2, attempt - 1));
          console.warn(`[${source}] Request to ${url} timed out. Retrying attempt ${attempt}/${retries} after ${Math.round(delay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`, source, timeoutMs, err);
      }

      // Handle network errors (connection dropped, DNS lookup failed, etc.)
      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ETIMEDOUT' ||
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
