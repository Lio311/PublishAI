import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as baseSchema from './schema';
import * as embeddingsSchema from './schema/embeddings';

const schema = { ...baseSchema, ...embeddingsSchema };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment");
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
