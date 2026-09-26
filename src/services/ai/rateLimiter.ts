/**
 * Rate limiting and retry utilities for LLM provider API calls.
 * Handles HTTP 429 (Rate Limit), 529 (Overloaded), transient network issues,
 * and concurrency throttling with exponential backoff and jitter.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  operationName?: string;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
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
    error.cause?.status;

  if (status === 429 || status === 529) return true;

  if (
    error.name === "RateLimitError" ||
    error.type === "rate_limit_error" ||
    error.code === "rate_limit_exceeded"
  ) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("ratelimit") ||
    message.includes("too many requests") ||
    message.includes("429") ||
    message.includes("overloaded") ||
    message.includes("resource_exhausted") ||
    message.includes("quota exceeded")
  );
}

/**
 * Determine if an error is transient and safe to retry (e.g. 500, 502, 503, 504, network reset).
 */
export function isTransientError(error: any): boolean {
  if (!error) return false;
  if (isRateLimitError(error)) return true;

  const status =
    error.status ||
    error.statusCode ||
    error.response?.status ||
    error.response?.statusCode ||
    error.cause?.status;

  if (status === 500 || status === 502 || status === 503 || status === 504) return true;

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("network error") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket hang up") ||
    message.includes("timeout") ||
    message.includes("service unavailable") ||
    message.includes("bad gateway")
  );
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

        console.warn(
          `[${operationName}] ${
            isRateLimit ? "Rate limit hit (429/529)" : "Transient error"
          } on attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(waitTime)}ms... Error: ${
            error?.message || error
          }`
        );

        if (onRetry) {
          onRetry(error, attempt, waitTime);
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        delay = Math.min(delay * backoffFactor, maxDelayMs);
      } else {
        console.error(
          `[${operationName}] Failed after ${attempt} attempt(s). Error: ${error?.message || error}`
        );
        throw error;
      }
    }
  }
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
