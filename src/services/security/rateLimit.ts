/**
 * In-memory sliding window rate limiter for API routes.
 * Uses IP-based tracking with configurable limits per route.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 300_000);
  cleanupInterval?.unref?.();
}

function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetMs: number } {
  ensureCleanup();

  const ip = getClientIp(request);
  const key = `${options.keyPrefix || "global"}:${ip}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (t) => now - t < options.windowMs
  );

  if (entry.timestamps.length >= options.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + options.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: options.maxRequests - entry.timestamps.length,
    resetMs: 0,
  };
}

export function rateLimitResponse(resetMs: number): Response {
  const retryAfter = Math.ceil(resetMs / 1000);
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

/**
 * Pre-configured rate limit presets for common route types.
 */
export const RATE_LIMITS = {
  /** AI agent runs: expensive, limit to 5/min */
  agentRun: { maxRequests: 5, windowMs: 60_000, keyPrefix: "agent-run" },
  /** Literature search: moderate, 20/min */
  literatureSearch: { maxRequests: 20, windowMs: 60_000, keyPrefix: "lit-search" },
  /** Auth endpoints: strict, 10/min to prevent brute force */
  auth: { maxRequests: 10, windowMs: 60_000, keyPrefix: "auth" },
  /** General API: 60/min */
  general: { maxRequests: 60, windowMs: 60_000, keyPrefix: "general" },
  /** File upload: 10/min */
  upload: { maxRequests: 10, windowMs: 60_000, keyPrefix: "upload" },
} as const;
