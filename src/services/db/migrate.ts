import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { validateDatabaseUrl } from "../../scripts/env";

export async function runMigrations(): Promise<void> {
  const databaseUrl = validateDatabaseUrl();
  console.log("Running migrations...");
  const sql = neon(databaseUrl);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "src/services/db/migrations" });
  console.log("Migrations applied successfully!");
}

if (require.main === module || process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed", err);
      process.exit(1);
    });
}
