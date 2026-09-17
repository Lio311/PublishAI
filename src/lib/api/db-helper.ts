/**
 * Safe database helper that allows routes to query Drizzle ORM when available,
 * while safely catching connection failures or missing schemas and falling back
 * to scaffolded mock data.
 */

export async function getSafeDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  try {
    const { db } = await import("@/db");
    return db;
  } catch (err) {
    console.warn("[DB Helper] Database or schema not ready. Falling back to scaffolded data.", err);
    return null;
  }
}

export async function getSafeAuth() {
  try {
    const { auth } = await import("@/auth");
    return await auth();
  } catch (err) {
    console.warn("[Auth Helper] Auth session check failed or not configured.", err);
    return null;
  }
}
