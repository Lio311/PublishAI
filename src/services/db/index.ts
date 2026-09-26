import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as baseSchema from './schema';
import * as embeddingsSchema from './schema/embeddings';

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
}

const schema = { ...baseSchema, ...embeddingsSchema };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL is not defined in the environment. Using dummy URL for build-time evaluation.");
}

const sql = neon(databaseUrl || "postgres://dummy:dummy@dummy/dummy");
export const db = drizzle(sql, { schema });

export * from './schema';
export * from './schema/embeddings';
export * from './zod';

