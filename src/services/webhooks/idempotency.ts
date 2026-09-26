/**
 * Webhook Idempotency Store
 *
 * Prevents duplicate processing of webhooks due to network retries,
 * at-least-once provider delivery, or replay attempts.
 * Supports Upstash Redis when configured, with an in-memory TTL store fallback.
 */

class InMemoryIdempotencyStore {
  private cache = new Map<string, number>();
  private readonly maxEntries = 5000;

  checkAndSet(key: string, ttlSeconds: number): boolean {
    const now = Date.now();
    this.evictExpired(now);

    const existingExpiry = this.cache.get(key);
    if (existingExpiry && existingExpiry > now) {
      // Key already exists and hasn't expired -> duplicate
      return true;
    }

    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, now + ttlSeconds * 1000);
    return false;
  }

  clear() {
    this.cache.clear();
  }

  private evictExpired(now: number) {
    if (this.cache.size > 500) {
      for (const [k, exp] of this.cache.entries()) {
        if (exp <= now) {
          this.cache.delete(k);
        }
      }
    }
  }
}

const memoryStore = new InMemoryIdempotencyStore();

let upstashRedisClient: any = null;

async function getRedisClient() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  if (!upstashRedisClient) {
    try {
      const { Redis } = await import("@upstash/redis");
      upstashRedisClient = Redis.fromEnv();
    } catch (e) {
      console.warn("[Idempotency] Failed to initialize Upstash Redis:", e);
      return null;
    }
  }
  return upstashRedisClient;
}

/**
 * Checks if a webhook event ID has already been recorded within the TTL window.
 * If not already present, records it and returns { isDuplicate: false }.
 * If already present, returns { isDuplicate: true }.
 *
 * @param eventId Unique identifier of the event (e.g. Stripe event id or messageId)
 * @param ttlSeconds TTL duration in seconds (default: 86400 = 24 hours)
 */
export async function checkAndRecordWebhookEvent(
  eventId: string,
  ttlSeconds: number = 86400
): Promise<{ isDuplicate: boolean }> {
  if (!eventId) {
    return { isDuplicate: false };
  }

  const redis = await getRedisClient();
  const redisKey = `publish-ai:webhook-idempotency:${eventId}`;

  if (redis) {
    try {
      // SET key 1 NX EX ttlSeconds
      // Returns "OK" if key was set (not seen before), or null if key already existed
      const setResult = await redis.set(redisKey, "1", {
        nx: true,
        ex: ttlSeconds,
      });

      if (setResult === null) {
        return { isDuplicate: true };
      }
      return { isDuplicate: false };
    } catch (err) {
      console.warn(
        `[Idempotency] Redis error for key ${redisKey}, falling back to memory store:`,
        err
      );
    }
  }

  // In-memory fallback
  const isDuplicate = memoryStore.checkAndSet(eventId, ttlSeconds);
  return { isDuplicate };
}

/**
 * Reset idempotency memory store (used for test isolation)
 */
export function resetWebhookIdempotency(): void {
  memoryStore.clear();
}
