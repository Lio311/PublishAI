import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let rateLimiter: Ratelimit | null = null;

function getRateLimiter() {
  if (!rateLimiter) {
    rateLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    });
  }
  return rateLimiter;
}

export async function checkRateLimit(userId: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn("UPSTASH_REDIS_REST_URL not set. Skipping rate limit.");
    return { success: true };
  }
  
  try {
    const limiter = getRateLimiter();
    return await limiter.limit(userId);
  } catch (error) {
    console.warn("Rate limit check failed:", error);
    return { success: true };
  }
}
