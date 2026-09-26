/**
 * Rate limiting, timeout, retry, and fallback utilities for LLM provider API calls.
 * Handles HTTP 429 (Rate Limit), 529 (Overloaded), transient network issues,
 * model fallbacks, timeouts, and concurrency throttling with exponential backoff and jitter.
 */

import { redactApiKeys } from "./promptSanitizer";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  operationName?: string;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export class TimeoutError extends Error {
  readonly status = 408;
  readonly isTimeout = true;
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Redact potential API keys (OpenAI sk-..., Anthropic sk-ant-..., Bearer tokens) from logged messages.
 */
function redactSecrets(msg: string): string {
  return redactApiKeys(msg);
}

/**
 * Determine if an error is an API rate-limit error (HTTP 429, 529, or quota issue).
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;

  const status =
    error.status ||
    error.statusCode ||
    error.response?.status ||
    error.response?.statusCode ||
    error.cause?.status ||
    error.cause?.statusCode;

  if (status === 429 || status === 529) return true;

  const code = error.code || error.cause?.code;
  if (
    error.name === "RateLimitError" ||
    error.type === "rate_limit_error" ||
    code === "rate_limit_exceeded" ||
    code === "insufficient_quota"
  ) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  const causeMessage = String(error.cause?.message || "").toLowerCase();
  const fullMessage = `${message} ${causeMessage}`;

  return (
    fullMessage.includes("rate limit") ||
    fullMessage.includes("ratelimit") ||
    fullMessage.includes("too many requests") ||
    fullMessage.includes("429") ||
    fullMessage.includes("overloaded") ||
    fullMessage.includes("resource_exhausted") ||
    fullMessage.includes("quota exceeded") ||
    fullMessage.includes("insufficient_quota")
  );
}

/**
 * Determine if an error is transient and safe to retry (e.g. 500, 502, 503, 504, network reset, timeout).
 */
export function isTransientError(error: any): boolean {
  if (!error) return false;
  if (isRateLimitError(error)) return true;
  if (error instanceof TimeoutError || error.isTimeout || error.name === "TimeoutError") return true;

  const status =
    error.status ||
    error.statusCode ||
    error.response?.status ||
    error.response?.statusCode ||
    error.cause?.status ||
    error.cause?.statusCode;

  if (status === 500 || status === 502 || status === 503 || status === 504 || status === 408) return true;

  const code = String(error.code || error.cause?.code || "").toUpperCase();
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  ) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  const causeMessage = String(error.cause?.message || "").toLowerCase();
  const fullMessage = `${message} ${causeMessage}`;

  return (
    fullMessage.includes("fetch failed") ||
    fullMessage.includes("network error") ||
    fullMessage.includes("econnreset") ||
    fullMessage.includes("etimedout") ||
    fullMessage.includes("socket hang up") ||
    fullMessage.includes("timeout") ||
    fullMessage.includes("service unavailable") ||
    fullMessage.includes("bad gateway")
  );
}

/**
 * Wraps a promise with a hard timeout. Rejects with TimeoutError if the promise does not settle within timeoutMs.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string = "Operation"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Attempt to extract a Retry-After header delay in milliseconds.
 */
export function getRetryAfterMs(error: any): number | null {
  const retryAfter =
    error?.headers?.["retry-after"] ||
    error?.response?.headers?.["retry-after"] ||
    (typeof error?.response?.headers?.get === "function"
      ? error.response.headers.get("retry-after")
      : null);

  if (retryAfter) {
    const parsed = parseFloat(retryAfter);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.ceil(parsed * 1000);
    }
    const parsedDate = Date.parse(retryAfter);
    if (!isNaN(parsedDate)) {
      const diff = parsedDate - Date.now();
      if (diff > 0) return diff;
    }
  }
  return null;
}

/**
 * Execute an async operation with automated exponential backoff retry
 * specifically tuned for LLM rate-limit (429) and transient network failures.
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 15000,
    backoffFactor = 2,
    operationName = "LLM call",
    onRetry,
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const isRateLimit = isRateLimitError(error);
      const isTransient = isTransientError(error);

      if ((isRateLimit || isTransient) && attempt <= maxRetries) {
        const retryAfter = getRetryAfterMs(error);
        const jitter = Math.random() * 300;
        const waitTime = Math.min(retryAfter ?? delay + jitter, maxDelayMs);

        const safeErrMsg = redactSecrets(error?.message || String(error));
        console.warn(
          `[${operationName}] ${
            isRateLimit ? "Rate limit hit (429/529)" : "Transient error"
          } on attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(waitTime)}ms... Error: ${safeErrMsg}`
        );

        if (onRetry) {
          onRetry(error, attempt, waitTime);
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        delay = Math.min(delay * backoffFactor, maxDelayMs);
      } else {
        const safeErrMsg = redactSecrets(error?.message || String(error));
        console.error(
          `[${operationName}] Failed after ${attempt} attempt(s). Error: ${safeErrMsg}`
        );
        throw error;
      }
    }
  }
}

export interface FallbackCandidate<M = string, P = string> {
  model: M;
  provider?: P;
}

export interface ModelFallbackOptions<M = string, P = string> {
  candidates: FallbackCandidate<M, P>[];
  operationName?: string;
  retryOptions?: RetryOptions;
  onFallback?: (
    failedCandidate: FallbackCandidate<M, P>,
    error: unknown,
    nextCandidate: FallbackCandidate<M, P>,
    index: number
  ) => void;
}

/**
 * Execute an LLM operation with automated fallback across a chain of candidate models/providers.
 * If candidate N exhausts its retries due to rate limits or transient errors, the system
 * seamlessly transitions to candidate N+1 until exhaustion.
 */
export async function withModelFallback<T, M = string, P = string>(
  execute: (candidate: FallbackCandidate<M, P>) => Promise<T>,
  options: ModelFallbackOptions<M, P>
): Promise<{ result: T; usedCandidate: FallbackCandidate<M, P> }> {
  const { candidates, operationName = "Model execution", retryOptions, onFallback } = options;

  if (!candidates || candidates.length === 0) {
    throw new Error(`[${operationName}] No model candidates provided for fallback execution.`);
  }

  let lastError: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const candidateLabel = `${candidate.provider ? `${candidate.provider}:` : ""}${candidate.model}`;

    try {
      const result = await withRateLimitRetry(
        () => execute(candidate),
        {
          ...retryOptions,
          operationName: `${operationName} [${candidateLabel}]`,
        }
      );
      return { result, usedCandidate: candidate };
    } catch (err: any) {
      lastError = err;
      const nextCandidate = candidates[i + 1];

      if (nextCandidate && (isRateLimitError(err) || isTransientError(err) || err?.status === 404 || err?.status === 400 || err?.code === "model_not_found")) {
        const safeErrMsg = redactSecrets(err?.message || String(err));
        console.warn(
          `[${operationName}] Candidate ${candidateLabel} failed (${safeErrMsg}). Falling back to ${
            nextCandidate.provider ? `${nextCandidate.provider}:` : ""
          }${nextCandidate.model}...`
        );
        if (onFallback) {
          onFallback(candidate, err, nextCandidate, i);
        }
        continue;
      }

      if (!nextCandidate) {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Map an array of items with a concurrency limit.
 * Helps prevent bursting through LLM TPM/RPM rate limits when triggering
 * multi-agent parallel operations.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (currentIndex < items.length) {
        const idx = currentIndex++;
        results[idx] = await fn(items[idx], idx);
      }
    }
  );

  await Promise.all(workers);
  return results;
}
