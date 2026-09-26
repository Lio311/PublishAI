/**
 * Safe database helper that allows routes and services to query Drizzle ORM and Postgres,
 * while safely catching connection failures, unhandled connection drops, or missing credentials,
 * and seamlessly falling back to scaffolded mock data.
 *
 * Resilience Features:
 * 1. Singleton pattern: Prevents connection leakage and exhaustion in serverless environments.
 * 2. Unhandled connection drop handling: Retries transient network/driver drops (ECONNRESET, 57P01, fetch failed).
 * 3. Safe environment detection: Disallows hardcoded connection strings and dummy fallbacks.
 */

import { isDatabaseConfigured, type AppDb } from "@/services/db";
import { getSafePgPool, isPgDatabaseConfigured, closePgPool } from "@/services/db/pool";

export { isDatabaseConfigured, isPgDatabaseConfigured, getSafePgPool, closePgPool };

interface GlobalHelperCache {
  __cached_safe_db__?: AppDb | null;
}

const globalForHelper = globalThis as unknown as GlobalHelperCache;

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

/**
 * Checks if an error is a transient database or network connection drop error.
 */
export function isTransientDbError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message || err).toLowerCase();
  const code = String((err as any)?.code || "").toUpperCase();

  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "EPIPE" ||
    code === "EHOSTUNREACH" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "UND_ERR_SOCKET" ||
    code === "57P01" || // PostgreSQL admin shutdown / terminating connection
    code === "08006" || // PostgreSQL connection failure
    code === "08001" || // PostgreSQL unable to establish connection
    code === "08003" || // PostgreSQL connection does not exist
    msg.includes("fetch failed") ||
    msg.includes("socket hang up") ||
    msg.includes("connection reset") ||
    msg.includes("connection terminated unexpectedly") ||
    msg.includes("terminating connection due to administrator command") ||
    msg.includes("endpoint is in transition") ||
    msg.includes("service unavailable") ||
    msg.includes("server error (http status 502)") ||
    msg.includes("server error (http status 503)") ||
    msg.includes("server error (http status 504)")
  );
}

/**
 * Safely retrieves the singleton Drizzle DB instance.
 * Returns null if DATABASE_URL is missing, dummy, or if connection setup fails.
 */
export async function getSafeDb(): Promise<AppDb | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (globalForHelper.__cached_safe_db__ !== undefined) {
    return globalForHelper.__cached_safe_db__;
  }

  try {
    const { db } = await import("@/services/db");
    globalForHelper.__cached_safe_db__ = db;
    return db;
  } catch (err) {
    console.warn("[DB Helper] Database or schema not ready. Falling back to scaffolded data.", err);
    globalForHelper.__cached_safe_db__ = null;
    return null;
  }
}

/**
 * Executes a database operation with automatic retries on transient connection drops.
 */
export async function executeWithRetry<T>(
  operation: (db: AppDb) => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  const db = await getSafeDb();
  if (!db) {
    return null;
  }

  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  const maxDelay = options.maxDelayMs ?? 1500;
  const factor = options.backoffFactor ?? 2;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(db);
    } catch (err) {
      lastError = err;
      if (isTransientDbError(err) && attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1) + Math.random() * 50, maxDelay);
        console.warn(
          `[DB Helper] Transient connection drop on query attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(delay)}ms...`,
          (err as any)?.message || err
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Safely executes a database query with retries, falling back to a default value
 * if the database is unconfigured, unreachable, or fails due to connection drop.
 */
export async function withSafeDb<T>(
  operation: (db: AppDb) => Promise<T>,
  fallback: T | (() => T | Promise<T>)
): Promise<T> {
  try {
    const result = await executeWithRetry(operation);
    if (result !== null && result !== undefined) {
      return result;
    }
  } catch (err) {
    console.warn("[DB Helper] Database query failed. Returning fallback.", (err as any)?.message || err);
  }

  return typeof fallback === "function" ? await (fallback as () => T | Promise<T>)() : fallback;
}

/**
 * Performs a lightweight health check on the database connection.
 */
export async function checkDatabaseConnection(): Promise<{
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return {
      healthy: false,
      error: "DATABASE_URL is not configured or is a placeholder",
    };
  }

  const startTime = Date.now();
  try {
    const { sql } = await import("@/services/db");
    await sql`SELECT 1 as ping`;
    return {
      healthy: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - startTime,
      error: err?.message || String(err),
    };
  }
}

export async function getSafeAuth() {
  try {
    const { auth } = await import("@/app/auth");
    return await auth();
  } catch (err) {
    console.warn("[Auth Helper] Auth session check failed or not configured.", err);
    return null;
  }
}
