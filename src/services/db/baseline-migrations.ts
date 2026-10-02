/**
 * Marks the existing migrations as applied in drizzle.__drizzle_migrations.
 *
 * The production schema was created with `drizzle-kit push`, so the migrations
 * table is empty and `migrate` would try to re-run every migration against
 * tables that already exist. Run this once, after confirming the live schema
 * matches src/services/db/schema.ts:
 *
 *   npx tsx src/services/db/baseline-migrations.ts            # dry run
 *   npx tsx src/services/db/baseline-migrations.ts --apply    # write records
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { validateDatabaseUrl } from "../../scripts/env";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/services/db/migrations");

interface JournalEntry {
  tag: string;
  when: number;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const sql = neon(validateDatabaseUrl());

  const journal: { entries: JournalEntry[] } = JSON.parse(
    fs.readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8")
  );

  if (apply) {
    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;
  }
  const existing = (await sql`select hash from drizzle.__drizzle_migrations`.catch(() => [])) as Array<{ hash: string }>;
  const applied = new Set(existing.map((row) => row.hash));

  for (const entry of journal.entries) {
    const query = fs.readFileSync(path.join(MIGRATIONS_DIR, `${entry.tag}.sql`), "utf8");
    // Same hash drizzle's migrator computes for the migration file.
    const hash = crypto.createHash("sha256").update(query).digest("hex");
    if (applied.has(hash)) {
      console.log(`= ${entry.tag} already recorded`);
      continue;
    }
    console.log(`${apply ? "+" : "would add"} ${entry.tag}`);
    if (apply) {
      await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${entry.when})`;
    }
  }

  if (!apply) console.log("\nDry run only. Re-run with --apply to write the records.");
}

main().catch((error) => {
  console.error("Baseline failed:", error);
  process.exit(1);
});
