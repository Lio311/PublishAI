/**
 * PublishAI HTTP Security Headers Configuration
 *
 * Defines industry-standard HTTP security headers, including Content-Security-Policy (CSP)
 * and HTTP Strict Transport Security (HSTS) to protect against XSS, clickjacking,
 * MIME-sniffing, and protocol downgrade attacks.
 */

export interface SecurityHeadersOptions {
  isProduction?: boolean;
  contentSecurityPolicy?: string;
  allowFraming?: boolean;
}

/**
 * Baseline Content Security Policy for PublishAI.
 * Allows necessary connections for Next.js, AI model providers, web sockets, and media.
 */
export const DEFAULT_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Generates an object of security headers suitable for middleware or response headers.
 */
export function getSecurityHeaders(
  options: SecurityHeadersOptions = {}
): Record<string, string> {
  const isProd =
    options.isProduction ?? process.env.NODE_ENV === "production";

  const csp = options.contentSecurityPolicy || DEFAULT_CONTENT_SECURITY_POLICY;

  const headers: Record<string, string> = {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": options.allowFraming ? "SAMEORIGIN" : "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  };

  // Only enforce HSTS when in production to avoid issues on plain HTTP localhost
  if (isProd) {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
  }

  return headers;
}

/**
 * Returns security headers formatted as an array for Next.js `next.config.ts` headers() entry.
 */
export function getSecurityHeadersArray(
  options: SecurityHeadersOptions = {}
): { key: string; value: string }[] {
  const headersObj = getSecurityHeaders(options);
  return Object.entries(headersObj).map(([key, value]) => ({
    key,
    value,
  }));
}

/**
 * Mutates a Headers instance (e.g. from NextResponse) to apply all security headers.
 */
export function applySecurityHeaders(
  headers: Headers,
  options: SecurityHeadersOptions = {}
): void {
  const securityHeaders = getSecurityHeaders(options);
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
}
