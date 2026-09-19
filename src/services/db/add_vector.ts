import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("Adding vector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  console.log("Vector extension added successfully!");
  process.exit(0);
}
main().catch((err) => {
  console.error("Failed to add vector extension", err);
  process.exit(1);
});
