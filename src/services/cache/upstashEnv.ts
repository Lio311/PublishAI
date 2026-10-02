/**
 * Upstash credentials arrive as UPSTASH_REDIS_REST_* (Upstash console) or
 * KV_REST_API_* (Vercel Marketplace integration). Redis.fromEnv() reads both.
 */
export function hasUpstashCredentials(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}
