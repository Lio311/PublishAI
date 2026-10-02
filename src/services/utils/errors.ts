/**
 * Safe accessors for values caught in `catch` blocks, which are `unknown`:
 * anything can be thrown, not only Error instances.
 */

function field(error: unknown, key: string): unknown {
  return typeof error === "object" && error !== null && key in error
    ? (error as Record<string, unknown>)[key]
    : undefined;
}

/** The error's message, or "" when there is none (so `errorMessage(e) || fallback` works). */
export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  const message = field(error, "message");
  return typeof message === "string" ? message : "";
}

export function errorName(error: unknown): string {
  const name = field(error, "name");
  return typeof name === "string" ? name : "";
}

/** Node / driver error codes such as "ECONNRESET" or "23505". */
export function errorCode(error: unknown): string | undefined {
  const code = field(error, "code");
  return typeof code === "string" || typeof code === "number" ? String(code) : undefined;
}

/** HTTP status attached by API clients (e.g. 429 from a provider SDK). */
export function errorStatus(error: unknown): number | undefined {
  const status = field(error, "status") ?? field(error, "statusCode");
  return typeof status === "number" ? status : undefined;
}
