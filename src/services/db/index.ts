import * as dotenv from 'dotenv';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as baseSchema from './schema';
import * as embeddingsSchema from './schema/embeddings';

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
}

export const schema = { ...baseSchema, ...embeddingsSchema };
export type AppSchema = typeof schema;
export type AppDb = ReturnType<typeof drizzle<AppSchema>>;

/**
 * Validates whether DATABASE_URL is configured, non-empty, and not a placeholder.
 */
export function isDatabaseConfigured(url?: string): boolean {
  const targetUrl = url ?? process.env.DATABASE_URL;
  if (!targetUrl || targetUrl.trim() === '') {
    return false;
  }
  if (
    targetUrl.includes('dummy:dummy') ||
    targetUrl.includes('@dummy/dummy') ||
    targetUrl.includes('placeholder')
  ) {
    return false;
  }
  return true;
}

interface GlobalDbCache {
  __publish_ai_sql__?: ReturnType<typeof neon>;
  __publish_ai_db__?: AppDb;
  __neon_resilience_configured__?: boolean;
}

const globalForDb = globalThis as unknown as GlobalDbCache;

/**
 * Helper to determine if an error is a transient network or connection drop error.
 */
function isTransientConnectionError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message || err).toLowerCase();
  const code = String((err as any)?.code || '').toUpperCase();
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'EPIPE' ||
    code === 'EHOSTUNREACH' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_SOCKET' ||
    msg.includes('fetch failed') ||
    msg.includes('socket hang up') ||
    msg.includes('connection reset') ||
    msg.includes('network error') ||
    msg.includes('terminated unexpectedly')
  );
}

/**
 * Configures Neon HTTP client with automatic retry capabilities on transient connection drops
 * and serverless cold-start delays (HTTP 502/503/504).
 */
function setupNeonResilience(): void {
  if (globalForDb.__neon_resilience_configured__) {
    return;
  }
  globalForDb.__neon_resilience_configured__ = true;

  const defaultFetch = neonConfig.fetchFunction ?? globalThis.fetch;
  if (!defaultFetch) return;

  neonConfig.fetchFunction = async (url: any, options?: any) => {
    const maxRetries = 3;
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await defaultFetch(url, options);
        // If Neon endpoint is scaling up from zero (502/503/504), retry with backoff
        if (
          (response.status === 502 || response.status === 503 || response.status === 504) &&
          attempt < maxRetries
        ) {
          const delayMs = Math.min(100 * Math.pow(2, attempt) + Math.random() * 50, 1500);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        return response;
      } catch (err) {
        lastErr = err;
        if (isTransientConnectionError(err) && attempt < maxRetries) {
          const delayMs = Math.min(100 * Math.pow(2, attempt) + Math.random() * 50, 1500);
          console.warn(
            `[Neon Driver] Transient connection drop on attempt ${attempt}/${maxRetries} (${(err as any)?.message || err}). Retrying in ${Math.round(delayMs)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  };
}

setupNeonResilience();

function createSqlClient(): ReturnType<typeof neon> {
  const databaseUrl = process.env.DATABASE_URL;

  if (isDatabaseConfigured(databaseUrl)) {
    return neon(databaseUrl!);
  }

  // Safe placeholder executor when DATABASE_URL is omitted or a placeholder (e.g. during build-time)
  // Avoids hardcoded connection strings while failing gracefully if queried.
  return ((..._args: any[]) => {
    throw new Error(
      '[Database] DATABASE_URL is not configured or is a placeholder. Please configure a valid DATABASE_URL in your environment.'
    );
  }) as unknown as ReturnType<typeof neon>;
}

// Singleton pattern for serverless warm starts & Next.js development HMR
if (!globalForDb.__publish_ai_db__ || !globalForDb.__publish_ai_sql__) {
  const sqlInstance = createSqlClient();
  globalForDb.__publish_ai_sql__ = sqlInstance;
  globalForDb.__publish_ai_db__ = drizzle(sqlInstance as any, { schema }) as AppDb;
}

export const sql = globalForDb.__publish_ai_sql__!;
export const db: AppDb = globalForDb.__publish_ai_db__!;

export * from './schema';
export * from './schema/embeddings';
export * from './zod';
export * from './pool';
