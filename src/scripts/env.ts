import * as dotenv from "dotenv";
import { Inngest } from "inngest";

/**
 * Ensures environment variables are loaded from .env.local and .env
 */
export function loadEnv(): void {
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
}

/**
 * Validates that DATABASE_URL is defined, non-empty, and not a dummy placeholder.
 * Terminates process with code 1 if invalid.
 */
export function validateDatabaseUrl(): string {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === "") {
    console.error("❌ [Config Error] DATABASE_URL is missing or empty.");
    console.error("   Please configure DATABASE_URL in your .env or .env.local file.");
    process.exit(1);
  }

  if (databaseUrl.includes("dummy:dummy") || databaseUrl.includes("@dummy/dummy")) {
    console.error("❌ [Config Error] DATABASE_URL points to a dummy placeholder URL.");
    console.error("   Please provide a valid PostgreSQL connection string in .env or .env.local.");
    process.exit(1);
  }

  return databaseUrl;
}

/**
 * Configures and validates the Inngest client for script execution.
 * In production, validates that INNGEST_EVENT_KEY is set.
 * In development, defaults to local dev server mode if no event key is provided.
 */
export function getInngestClient(scriptName: string = "script"): Inngest {
  loadEnv();

  const isProd = process.env.NODE_ENV === "production";
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const baseUrl = process.env.INNGEST_BASE_URL;

  if (isProd && !eventKey) {
    console.error(`❌ [${scriptName}] INNGEST_EVENT_KEY is required in production environment.`);
    console.error("   Please set INNGEST_EVENT_KEY in your environment variables.");
    process.exit(1);
  }

  const inngestOptions: {
    id: string;
    isDev?: boolean;
    eventKey?: string;
    baseUrl?: string;
  } = {
    id: "publish-ai",
  };

  if (eventKey) {
    inngestOptions.eventKey = eventKey;
  }

  if (baseUrl) {
    inngestOptions.baseUrl = baseUrl;
  }

  // If not prod and no event key, enable dev mode to connect to local Inngest Dev Server
  if (!isProd && !eventKey) {
    inngestOptions.isDev = true;
  }

  return new Inngest(inngestOptions);
}

/**
 * Wrapper for running CLI scripts with robust error handling and clear exit codes.
 */
export function runScript(name: string, fn: () => Promise<void>): void {
  loadEnv();
  fn()
    .then(() => {
      console.log(`\n✅ [${name}] Completed successfully.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\n❌ [${name}] Script execution failed:`, err);
      process.exit(1);
    });
}
