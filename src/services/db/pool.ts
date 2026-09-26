import { Pool, PoolConfig } from "pg";
import * as dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
}

interface GlobalPoolCache {
  __publish_ai_pg_pool__?: Pool;
}

const globalForPool = globalThis as unknown as GlobalPoolCache;

/**
 * Validates whether DATABASE_URL is configured, non-empty, and not a dummy placeholder.
 */
export function isPgDatabaseConfigured(url?: string): boolean {
  const targetUrl = url ?? process.env.DATABASE_URL;
  if (!targetUrl || targetUrl.trim() === "") {
    return false;
  }
  if (
    targetUrl.includes("dummy:dummy") ||
    targetUrl.includes("@dummy/dummy") ||
    targetUrl.includes("placeholder")
  ) {
    return false;
  }
  return true;
}

/**
 * Returns a singleton pg.Pool instance configured for serverless resilience.
 *
 * Key Resilience Features:
 * 1. Singleton pattern: Reuses pool across HMR in dev and warm serverless lambdas to prevent connection exhaustion.
 * 2. Error handling: Attaches 'error' event listener to prevent unhandled connection drop crashes.
 * 3. Connection sizing: Limits max connections (default 5) to prevent connection starvation in serverless.
 * 4. Timeouts: Configures idleTimeoutMillis (30s) and connectionTimeoutMillis (5s) for fast recovery.
 */
export function getSafePgPool(customConfig?: PoolConfig): Pool | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!isPgDatabaseConfigured(databaseUrl)) {
    return null;
  }

  if (globalForPool.__publish_ai_pg_pool__) {
    return globalForPool.__publish_ai_pg_pool__;
  }

  const poolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 5;
  const pool = new Pool({
    connectionString: databaseUrl,
    max: poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: false,
    ...customConfig,
  });

  // Attach error listener to prevent idle client connection drops from crashing the Node.js process
  pool.on("error", (err: Error) => {
    console.warn(
      "[Postgres Pool] Idle client connection drop or error encountered (recovering automatically):",
      err?.message || err
    );
  });

  globalForPool.__publish_ai_pg_pool__ = pool;
  return pool;
}

/**
 * Closes the singleton pool if open (useful during test teardown or graceful shutdown).
 */
export async function closePgPool(): Promise<void> {
  if (globalForPool.__publish_ai_pg_pool__) {
    try {
      await globalForPool.__publish_ai_pg_pool__.end();
    } catch (err) {
      console.warn("[Postgres Pool] Error while closing pool:", err);
    } finally {
      globalForPool.__publish_ai_pg_pool__ = undefined;
    }
  }
}
