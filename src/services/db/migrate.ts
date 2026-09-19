import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "src/services/db/migrations" });
  console.log("Migrations applied successfully!");
  process.exit(0);
}
main().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});
