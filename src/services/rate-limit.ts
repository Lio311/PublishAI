import { NextResponse } from "next/server";

export type RateLimitTier =
  | "ai"       // 10 req / 1 min (LLM, Agents, Embeddings, heavy AI endpoints)
  | "auth"     // 10 req / 1 min (Register, Login, Captcha verification)
  | "upload"   // 10 req / 1 min (File uploads, docx, pdf, datasets)
  | "strict"   // 5 req / 1 min (Auto-fix, sensitive credential tests)
  | "write"    // 30 req / 1 min (Database mutations: POST, PUT, PATCH, DELETE)
  | "read"     // 60 req / 1 min (Database queries: GET)
  | "standard"; // 60 req / 1 min (Default fallback)

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const TIER_CONFIG: Record<RateLimitTier, { requests: number; window: "1 m" }> = {
  ai: { requests: 10, window: "1 m" },
  auth: { requests: 10, window: "1 m" },
  upload: { requests: 10, window: "1 m" },
  strict: { requests: 5, window: "1 m" },
  write: { requests: 30, window: "1 m" },
  read: { requests: 60, window: "1 m" },
  standard: { requests: 60, window: "1 m" },
};

// In-memory sliding window fallback for environments without Upstash Redis
const inMemoryCache = new Map<string, number[]>();
let lastPruned = Date.now();

function checkInMemoryRateLimit(identifier: string, limit: number, windowMs = 60000): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Periodic cleanup every 60 seconds
  if (now - lastPruned > 60000) {
    for (const [key, timestamps] of inMemoryCache.entries()) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        inMemoryCache.delete(key);
      } else {
        inMemoryCache.set(key, valid);
      }
    }
    lastPruned = now;
  }

  const timestamps = (inMemoryCache.get(identifier) || []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const earliest = timestamps[0];
    const reset = earliest + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  timestamps.push(now);
  inMemoryCache.set(identifier, timestamps);

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    reset: now + windowMs,
  };
}

let UpstashRatelimit: any = null;
let UpstashRedis: any = null;
const rateLimiters: Partial<Record<RateLimitTier, any>> = {};
let hasLoggedEnvWarning = false;

async function getRateLimiterForTier(tier: RateLimitTier): Promise<any | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!hasLoggedEnvWarning && process.env.NODE_ENV !== "test") {
      console.warn("[RateLimit] Upstash Redis credentials not set. Falling back to in-memory rate limiting.");
      hasLoggedEnvWarning = true;
    }
    return null;
  }

  if (!rateLimiters[tier]) {
    try {
      if (!UpstashRatelimit || !UpstashRedis) {
        const ratelimitMod = await import("@upstash/ratelimit");
        const redisMod = await import("@upstash/redis");
        UpstashRatelimit = ratelimitMod.Ratelimit;
        UpstashRedis = redisMod.Redis;
      }
      const config = TIER_CONFIG[tier];
      rateLimiters[tier] = new UpstashRatelimit({
        redis: UpstashRedis.fromEnv(),
        limiter: UpstashRatelimit.slidingWindow(config.requests, config.window),
        prefix: `publish-ai:rl:${tier}`,
        analytics: true,
      });
    } catch (err) {
      console.warn(`[RateLimit] Failed to initialize Upstash limiter for tier ${tier}:`, err);
      return null;
    }
  }

  return rateLimiters[tier] || null;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = "standard"
): Promise<RateLimitResult> {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.standard;
  const limiter = await getRateLimiterForTier(tier);

  if (!limiter) {
    return checkInMemoryRateLimit(`${tier}:${identifier}`, config.requests, 60000);
  }

  try {
    const res = await limiter.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    console.warn(`[RateLimit] Upstash check failed for ${identifier} (${tier}), falling back to memory:`, error);
    return checkInMemoryRateLimit(`${tier}:${identifier}`, config.requests, 60000);
  }
}

export function rateLimitResponse(result?: Partial<RateLimitResult>): NextResponse {
  const resetMs = result?.reset ? Math.max(0, result.reset - Date.now()) : 60000;
  const retryAfterSec = Math.ceil(resetMs / 1000);

  const headers: Record<string, string> = {
    "Retry-After": retryAfterSec.toString(),
  };

  if (result?.limit !== undefined) {
    headers["X-RateLimit-Limit"] = result.limit.toString();
  }
  if (result?.remaining !== undefined) {
    headers["X-RateLimit-Remaining"] = result.remaining.toString();
  }
  if (result?.reset !== undefined) {
    headers["X-RateLimit-Reset"] = result.reset.toString();
  }

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers,
    }
  );
}

export async function applyRateLimit(
  req: Request,
  tier: RateLimitTier = "standard",
  userId?: string | null
): Promise<NextResponse | null> {
  const identifier = userId || getClientIp(req);
  const result = await checkRateLimit(identifier, tier);
  if (!result.success) {
    return rateLimitResponse(result);
  }
  return null;
}
