/**
 * PublishAI Open Redirect Protection
 *
 * Validates and sanitizes destination URLs to prevent open redirect vulnerabilities.
 */

export interface SafeRedirectOptions {
  /**
   * The base URL or origin of the application (e.g. process.env.NEXTAUTH_URL or request origin).
   * Defaults to process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, or 'http://localhost:3000'.
   */
  baseUrl?: string;
  /**
   * Additional trusted origins allowed for redirection (e.g., identity providers).
   */
  allowedOrigins?: string[];
  /**
   * Fallback URL if the provided URL is untrusted or invalid. Defaults to '/he'.
   */
  fallbackUrl?: string;
}

/**
 * Normalizes a base origin string to ensure it has no trailing slash and includes a protocol.
 */
function getNormalizedOrigin(urlStr?: string): string {
  if (!urlStr) {
    urlStr =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";
  }
  try {
    const parsed = new URL(urlStr);
    return parsed.origin.toLowerCase();
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Checks whether a given URL is safe to redirect to.
 *
 * Rules:
 * 1. Must be a non-empty string without unprintable control characters, newlines, or tabs.
 * 2. Cannot start with protocol-relative '//', '\\', or backslash combinations ('/\\', '\\/').
 * 3. Cannot contain backslashes before query/hash or use dangerous schemes (javascript:, data:, vbscript:).
 * 4. Relative paths starting with a single '/' are safe as long as they stay within the same origin.
 * 5. Absolute URLs must match the application origin or one of the explicitly allowed origins.
 *
 * @param url The candidate redirect URL
 * @param options Options including baseUrl and allowedOrigins
 * @returns boolean true if safe, false if potentially dangerous
 */
export function isSafeRedirect(
  url: unknown,
  options: SafeRedirectOptions = {}
): boolean {
  if (typeof url !== "string" || !url) {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  // Prevent control characters, line breaks, null bytes (%00, \0), and CR/LF injection
  if (/[\r\n\t\x00-\x1f\x7f]/.test(trimmed)) {
    return false;
  }

  // Reject URL-encoded CR/LF or null bytes
  if (/%0[0-9a-f]|%1[0-9a-f]|%7f/i.test(trimmed)) {
    return false;
  }

  // Reject protocol-relative and backslash bypass attempts:
  // e.g. //evil.com, /\evil.com, /\\evil.com, \evil.com, \\evil.com, /%5cevil.com, /%2fevil.com
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\") ||
    trimmed.startsWith("/\\\\") ||
    /^(\/|\\)*(%2f|%5c)/i.test(trimmed)
  ) {
    return false;
  }

  // Reject dangerous schemes
  const lowerTrimmed = trimmed.toLowerCase();
  if (
    lowerTrimmed.startsWith("javascript:") ||
    lowerTrimmed.startsWith("data:") ||
    lowerTrimmed.startsWith("vbscript:") ||
    lowerTrimmed.startsWith("file:")
  ) {
    return false;
  }

  const baseOrigin = getNormalizedOrigin(options.baseUrl);
  const allowedOrigins = new Set(
    (options.allowedOrigins || []).map((o) => {
      try {
        return new URL(o).origin.toLowerCase();
      } catch {
        return o.toLowerCase();
      }
    })
  );
  allowedOrigins.add(baseOrigin);

  try {
    // Resolve candidate against baseOrigin
    const parsed = new URL(trimmed, baseOrigin);

    // Only allow HTTP and HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    // Ensure the pathname does not contain backslashes
    if (parsed.pathname.includes("\\") || parsed.pathname.includes("%5c")) {
      return false;
    }

    // Check if the resolved origin matches allowed origins
    const candidateOrigin = parsed.origin.toLowerCase();
    if (!allowedOrigins.has(candidateOrigin)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a sanitized safe redirect URL.
 * If the input URL is safe, it is returned. Otherwise, returns a safe fallback URL.
 *
 * @param url Candidate URL to redirect to
 * @param options Configuration for validation and fallback
 * @returns Safe URL string
 */
export function getSafeRedirectUrl(
  url: unknown,
  options: SafeRedirectOptions = {}
): string {
  const fallback = options.fallbackUrl || "/he";

  if (!isSafeRedirect(url, options)) {
    return fallback;
  }

  const trimmed = (url as string).trim();
  const baseOrigin = getNormalizedOrigin(options.baseUrl);

  try {
    const parsed = new URL(trimmed, baseOrigin);
    // If it's the exact same origin as the application, return relative path with query/hash
    if (parsed.origin.toLowerCase() === baseOrigin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
    }
    // If it's an allowed external origin, return full URL
    return parsed.href;
  } catch {
    return fallback;
  }
}
