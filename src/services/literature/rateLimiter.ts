/**
 * Rate Limiter and Request Pacer for External Scientific Literature APIs
 *
 * Enforces per-domain concurrency limits, request pacing (minimum delay between requests),
 * and dynamic pauses when remote APIs return HTTP 429 with Retry-After.
 *
 * Specific defaults:
 * - PubMed (NCBI): 3 req/s without API key (min 350ms interval); 10 req/s with NCBI_API_KEY (min 100ms interval).
 * - CrossRef: 50 req/s polite pool (min 25ms interval).
 * - Semantic Scholar: 1 req/s without API key (min 1050ms interval); 10 req/s with SEMANTIC_SCHOLAR_API_KEY (min 100ms interval).
 */

import { LiteratureSource } from './types';

export interface DomainPacerConfig {
  minIntervalMs: number;
  maxConcurrent: number;
  maxQueueSize?: number;
}

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
}

export class LiteratureRateLimiter {
  private configs: Map<string, DomainPacerConfig> = new Map();
  private queues: Map<string, QueuedTask<any>[]> = new Map();
  private inFlight: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private pausedUntil: Map<string, number> = new Map();
  private processing: Map<string, boolean> = new Map();

  constructor() {
    this.initDefaultConfigs();
  }

  private initDefaultConfigs(): void {
    const hasNcbiKey = Boolean(process.env.NCBI_API_KEY);
    const hasSemanticScholarKey = Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY);

    // PubMed: NCBI limits to 3 req/s without key, 10 req/s with key
    this.configs.set('pubmed', {
      minIntervalMs: hasNcbiKey ? 100 : 350,
      maxConcurrent: hasNcbiKey ? 5 : 2,
      maxQueueSize: 200,
    });

    // CrossRef: Polite pool allows high throughput, keep polite pacing
    this.configs.set('crossref', {
      minIntervalMs: 25,
      maxConcurrent: 5,
      maxQueueSize: 200,
    });

    // Semantic Scholar: 1 req/s without key, 10 req/s with key
    this.configs.set('semanticscholar', {
      minIntervalMs: hasSemanticScholarKey ? 100 : 1050,
      maxConcurrent: hasSemanticScholarKey ? 5 : 1,
      maxQueueSize: 200,
    });
  }

  /**
   * Schedule a request through the rate limiter.
   */
  async schedule<T>(source: LiteratureSource | 'literature_service', fn: () => Promise<T>): Promise<T> {
    const key = source;
    const config = this.configs.get(key) || {
      minIntervalMs: 100,
      maxConcurrent: 3,
      maxQueueSize: 200,
    };

    if (!this.queues.has(key)) {
      this.queues.set(key, []);
      this.inFlight.set(key, 0);
      this.lastRequestTime.set(key, 0);
      this.pausedUntil.set(key, 0);
    }

    const queue = this.queues.get(key)!;
    const maxQueue = config.maxQueueSize || 200;

    if (queue.length >= maxQueue) {
      throw new Error(`Rate limiter queue full for source "${key}" (${queue.length} tasks waiting).`);
    }

    return new Promise<T>((resolve, reject) => {
      queue.push({
        fn,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      });

      this.processQueue(key);
    });
  }

  /**
   * Pause outgoing requests to a source for a given duration (e.g. from Retry-After).
   */
  pause(source: LiteratureSource | 'literature_service', durationMs: number): void {
    const now = Date.now();
    const currentPaused = this.pausedUntil.get(source) || 0;
    const newPaused = Math.max(currentPaused, now + durationMs);
    this.pausedUntil.set(source, newPaused);
    console.warn(`[LiteratureRateLimiter] Source "${source}" paused for ${Math.round(durationMs)}ms (until ${new Date(newPaused).toISOString()})`);

    // Schedule queue resume
    setTimeout(() => {
      this.processQueue(source);
    }, durationMs + 10).unref?.();
  }

  /**
   * Check if a source is currently paused.
   */
  isPaused(source: LiteratureSource | 'literature_service'): boolean {
    const pauseExpiry = this.pausedUntil.get(source) || 0;
    return Date.now() < pauseExpiry;
  }

  /**
   * Get remaining pause duration in milliseconds.
   */
  getRemainingPauseMs(source: LiteratureSource | 'literature_service'): number {
    const pauseExpiry = this.pausedUntil.get(source) || 0;
    return Math.max(0, pauseExpiry - Date.now());
  }

  private async processQueue(key: string): Promise<void> {
    if (this.processing.get(key)) {
      return;
    }
    this.processing.set(key, true);

    try {
      const config = this.configs.get(key) || { minIntervalMs: 100, maxConcurrent: 3 };
      const queue = this.queues.get(key) || [];

      while (queue.length > 0) {
        const inFlight = this.inFlight.get(key) || 0;
        if (inFlight >= config.maxConcurrent) {
          break;
        }

        // Check if paused
        const pauseExpiry = this.pausedUntil.get(key) || 0;
        const now = Date.now();
        if (now < pauseExpiry) {
          const waitTime = pauseExpiry - now;
          setTimeout(() => {
            this.processQueue(key);
          }, waitTime + 5).unref?.();
          break;
        }

        // Check pacing interval
        const lastTime = this.lastRequestTime.get(key) || 0;
        const elapsedSinceLast = now - lastTime;
        if (elapsedSinceLast < config.minIntervalMs) {
          const waitTime = config.minIntervalMs - elapsedSinceLast;
          setTimeout(() => {
            this.processQueue(key);
          }, waitTime).unref?.();
          break;
        }

        const task = queue.shift();
        if (!task) break;

        this.inFlight.set(key, (this.inFlight.get(key) || 0) + 1);
        this.lastRequestTime.set(key, Date.now());

        // Execute task
        task.fn()
          .then((val) => task.resolve(val))
          .catch((err) => task.reject(err))
          .finally(() => {
            this.inFlight.set(key, Math.max(0, (this.inFlight.get(key) || 1) - 1));
            this.processQueue(key);
          });
      }
    } finally {
      this.processing.set(key, false);
    }
  }

  /**
   * Clear all queues and pauses (useful in tests).
   */
  reset(): void {
    for (const queue of this.queues.values()) {
      for (const task of queue) {
        task.reject(new Error('Rate limiter reset'));
      }
      queue.length = 0;
    }
    this.inFlight.clear();
    this.lastRequestTime.clear();
    this.pausedUntil.clear();
    this.processing.clear();
  }
}

export const literatureRateLimiter = new LiteratureRateLimiter();
