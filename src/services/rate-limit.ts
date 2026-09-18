import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 5 requests per 1 minute
export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

export async function checkRateLimit(userId: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn("UPSTASH_REDIS_REST_URL not set. Skipping rate limit.");
    return { success: true };
  }
  
  return await rateLimit.limit(userId);
}
