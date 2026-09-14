require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`DROP TABLE IF EXISTS "paper_stages" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "paper_versions" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "references" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "papers" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "journals" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "session" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "account" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "verificationToken" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "users" CASCADE;`;
  console.log('Tables dropped');
}

run().catch(console.error);
