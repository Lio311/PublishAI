import { neon } from "@neondatabase/serverless";
import { validateDatabaseUrl } from "../../scripts/env";

export async function addVectorExtension(): Promise<void> {
  const databaseUrl = validateDatabaseUrl();
  console.log("Adding vector extension...");
  const sql = neon(databaseUrl);
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  console.log("Vector extension added successfully!");
}

if (require.main === module || process.argv[1]?.endsWith("add_vector.ts")) {
  addVectorExtension()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to add vector extension", err);
      process.exit(1);
    });
}
