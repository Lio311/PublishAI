/**
 * PublishAI CSRF Protection Service
 *
 * Implements Defense-in-Depth Cross-Site Request Forgery (CSRF) protections for
 * non-NextAuth state-changing API routes (POST, PUT, PATCH, DELETE).
 *
 * Mechanisms:
 * 1. Same-Origin Verification (Origin & Referer matching against Host / X-Forwarded-Host).
 * 2. Sec-Fetch-Site restriction (blocks cross-site browser requests).
 * 3. Token-based CSRF generation and verification (HMAC SHA-256 tokens).
 * 4. Automatic exemption handling for webhooks (Stripe, Inngest, email) and NextAuth routes.
 */

export interface CsrfOptions {
  allowedOrigins?: string[];
  exemptRoutes?: (string | RegExp)[];
}

/**
 * Routes exempt from standard CSRF origin checks because they use alternative
 * cryptographic authentication (e.g. webhook HMAC signatures, Inngest signing keys, NextAuth tokens).
 */
export const DEFAULT_EXEMPT_ROUTES: (string | RegExp)[] = [
  /^\/api\/auth(\/.*)?$/,       // NextAuth manages its own CSRF tokens
  /^\/api\/webhooks(\/.*)?$/,   // Webhooks authenticate via cryptographic signatures
  /^\/api\/inngest(\/.*)?$/,    // Inngest background handler uses Inngest signing key
  /^\/api\/mcp(\/.*)?$/,        // MCP server tools for AI agents
];

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Determines whether a given pathname is exempt from standard CSRF checks.
 */
export function isRouteExemptFromCsrf(
  pathname: string,
  customExemptions: (string | RegExp)[] = []
): boolean {
  const allExemptions = [...DEFAULT_EXEMPT_ROUTES, ...customExemptions];
  return allExemptions.some((pattern) => {
    if (typeof pattern === "string") {
      return pathname === pattern || pathname.startsWith(pattern);
    }
    return pattern.test(pathname);
  });
}

/**
 * Extracts a normalized hostname (and optional port) from a URL or header.
 */
function normalizeHost(hostOrUrl: string | null | undefined): string | null {
  if (!hostOrUrl) return null;
  const trimmed = hostOrUrl.trim().toLowerCase();
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).host;
    }
    return new URL(`http://${trimmed}`).host;
  } catch {
    return trimmed.split("/")[0] || null;
  }
}

/**
 * Validates a state-changing API request against CSRF attacks.
 *
 * @param request Web Request or NextRequest
 * @param options Configuration options including allowedOrigins and custom exemptions
 * @returns Result object indicating if the request is allowed or forbidden
 */
export function validateCsrf(
  request: Request,
  options: CsrfOptions = {}
): { isAllowed: boolean; statusCode?: number; error?: string } {
  const method = (request.method || "GET").toUpperCase();

  // Safe HTTP methods do not change state
  if (!STATE_CHANGING_METHODS.has(method)) {
    return { isAllowed: true };
  }

  // Extract pathname
  let pathname = "";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    pathname = "/";
  }

  // Check if route is exempt (e.g. webhooks, Inngest, NextAuth)
  if (isRouteExemptFromCsrf(pathname, options.exemptRoutes)) {
    return { isAllowed: true };
  }

  const headers = request.headers;

  // 1. Sec-Fetch-Site check (Modern Browsers)
  // If a browser explicitly tags the request as cross-site, reject immediately.
  const secFetchSite = headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return {
      isAllowed: false,
      statusCode: 403,
      error: "Forbidden: Cross-site request rejected (Sec-Fetch-Site).",
    };
  }

  // 2. Determine target host
  const hostHeader =
    headers.get("x-forwarded-host") || headers.get("host") || "";
  let targetHost = normalizeHost(hostHeader);
  if (!targetHost) {
    try {
      targetHost = normalizeHost(new URL(request.url).host);
    } catch {
      targetHost = null;
    }
  }

  // Allowed target origins/hosts
  const allowedHosts = new Set<string>();
  if (targetHost) allowedHosts.add(targetHost);

  const envOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    ...(options.allowedOrigins || []),
  ];

  for (const origin of envOrigins) {
    const nh = normalizeHost(origin);
    if (nh) allowedHosts.add(nh);
  }

  // 3. Origin Header check
  const originHeader = headers.get("origin");
  if (originHeader) {
    const originHost = normalizeHost(originHeader);
    if (!originHost || !allowedHosts.has(originHost)) {
      return {
        isAllowed: false,
        statusCode: 403,
        error: `Forbidden: Invalid request origin '${originHeader}'.`,
      };
    }
    return { isAllowed: true };
  }

  // 4. Referer Header fallback check (when Origin header is omitted by browser)
  const refererHeader = headers.get("referer");
  if (refererHeader) {
    const refererHost = normalizeHost(refererHeader);
    if (!refererHost || !allowedHosts.has(refererHost)) {
      return {
        isAllowed: false,
        statusCode: 403,
        error: `Forbidden: Invalid request referer '${refererHeader}'.`,
      };
    }
    return { isAllowed: true };
  }

  // 5. If neither Origin nor Referer is present:
  // Non-browser / machine-to-machine requests or test mocks often lack Origin/Referer.
  // In browsers, standard HTML forms always send Origin or Referer on POST.
  // If the request contains custom headers (like Authorization or x-csrf-token), it was not a cross-origin form post.
  const hasCustomHeader =
    headers.has("authorization") ||
    headers.has("x-csrf-token") ||
    headers.has("x-requested-with");

  if (hasCustomHeader) {
    return { isAllowed: true };
  }

  // If in production and a state-changing browser-like request arrives with cookies but no Origin or Referer:
  const hasSessionCookie =
    headers.get("cookie")?.includes("authjs.session-token") ||
    headers.get("cookie")?.includes("next-auth.session-token");

  if (hasSessionCookie && process.env.NODE_ENV === "production") {
    return {
      isAllowed: false,
      statusCode: 403,
      error: "Forbidden: Missing required Origin or Referer header on state-changing request.",
    };
  }

  return { isAllowed: true };
}

/**
 * Creates an HMAC CSRF token tied to a session ID or user ID.
 */

export async function generateCsrfToken(sessionId: string, secret?: string): Promise<string> {
  const tokenSecret =
    secret ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-csrf-secret";
  const timestamp = Date.now().toString();
  const data = `${sessionId}:${timestamp}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(tokenSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const hmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${data}:${hmac}`;
}


function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyCsrfToken(
  token: string,
  sessionId: string,
  secret?: string,
  maxAgeMs = 2 * 60 * 60 * 1000
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [tokSessionId, tokTimestamp, tokHmac] = parts;
  if (tokSessionId !== sessionId) return false;

  const timestampNum = parseInt(tokTimestamp, 10);
  if (isNaN(timestampNum) || Date.now() - timestampNum > maxAgeMs) {
    return false;
  }

  const tokenSecret =
    secret ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-csrf-secret";
    
  const data = `${tokSessionId}:${tokTimestamp}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(tokenSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const expectedHmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqualStr(tokHmac, expectedHmac);
}
