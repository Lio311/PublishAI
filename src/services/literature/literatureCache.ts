/**
 * Multi-tier Cache for Literature Search and Citations
 * 
 * L1: In-Memory LRU Cache with bounded capacity and TTL eviction (prevents memory leaks)
 * L2: Upstash Redis (if configured via UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
 */

import { LiteratureSearchOptions } from './types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface LiteratureCacheOptions {
  maxCapacity?: number;
  useRedis?: boolean;
  defaultSearchTtlSeconds?: number;
  defaultArticleTtlSeconds?: number;
}

export class InMemoryLruCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxCapacity: number;

  constructor(maxCapacity: number = 500) {
    this.maxCapacity = Math.max(1, maxCapacity);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order (delete and re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    // If already present, remove to update position
    this.cache.delete(key);

    // Evict oldest item if at capacity
    if (this.cache.size >= this.maxCapacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export class LiteratureCache {
  private memoryCache: InMemoryLruCache;
  private redisClient: any = null;
  private defaultSearchTtl: number;
  private defaultArticleTtl: number;

  constructor(options: LiteratureCacheOptions = {}) {
    this.memoryCache = new InMemoryLruCache(options.maxCapacity ?? 500);
    this.defaultSearchTtl = options.defaultSearchTtlSeconds ?? 3600; // 1 hour for searches
    this.defaultArticleTtl = options.defaultArticleTtlSeconds ?? 86400; // 24 hours for articles

    if (
      options.useRedis !== false &&
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      try {
        const { Redis } = require('@upstash/redis');
        this.redisClient = Redis.fromEnv();
      } catch (e) {
        console.warn('[LiteratureCache] Failed to initialize Upstash Redis, falling back to memory only:', e);
        this.redisClient = null;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Try L1 memory cache
    const memoryValue = this.memoryCache.get<T>(key);
    if (memoryValue !== null) {
      return memoryValue;
    }

    // 2. Try L2 Redis cache if available
    if (this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue !== null && redisValue !== undefined) {
          // Re-populate L1 memory cache with a 5-minute buffer
          this.memoryCache.set(key, redisValue, 300);
          return redisValue as T;
        }
      } catch (err) {
        console.warn('[LiteratureCache] Redis read failed, continuing without Redis:', err);
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultSearchTtl;
    // Set in memory
    this.memoryCache.set(key, value, ttl);

    // Set in Redis
    if (this.redisClient) {
      try {
        await this.redisClient.set(key, value, { ex: ttl });
      } catch (err) {
        console.warn('[LiteratureCache] Redis write failed:', err);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        console.warn('[LiteratureCache] Redis delete failed:', err);
      }
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  getSearchKey(source: string, query: string, options: LiteratureSearchOptions = {}): string {
    const normalizedQuery = query.trim().toLowerCase();
    const limit = options.limit || 5;
    const offset = options.offset || 0;
    const yearFrom = options.yearFrom || '';
    const yearTo = options.yearTo || '';
    return `lit:search:${source}:${normalizedQuery}:${limit}:${offset}:${yearFrom}:${yearTo}`;
  }

  getArticleKey(source: string, idOrDoi: string): string {
    const cleanId = idOrDoi.trim().toLowerCase().replace(/^https?:\/\/doi\.org\//i, '');
    return `lit:article:${source}:${cleanId}`;
  }

  getDefaultSearchTtl(): number {
    return this.defaultSearchTtl;
  }

  getDefaultArticleTtl(): number {
    return this.defaultArticleTtl;
  }

  getMemorySize(): number {
    return this.memoryCache.size();
  }
}

export const literatureCache = new LiteratureCache();
