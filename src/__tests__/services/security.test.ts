import { webcrypto } from "crypto";
Object.defineProperty(global, 'crypto', { value: webcrypto });
import {
  isSafeRedirect,
  getSafeRedirectUrl,
} from "@/services/security/redirect";
import {
  getSecurityHeaders,
  getSecurityHeadersArray,
  applySecurityHeaders,
  DEFAULT_CONTENT_SECURITY_POLICY,
} from "@/services/security/headers";
import {
  validateCsrf,
  generateCsrfToken,
  verifyCsrfToken,
  isRouteExemptFromCsrf,
} from "@/services/security/csrf";
import {
  encrypt,
  decrypt,
  isEncrypted,
  safeDecrypt,
  maskSecret,
} from "@/services/security/encryption";

describe("Security Service Audit Test Suite", () => {
  // ═══════════════════════════════════════════════════════
  // 1. OPEN REDIRECT DEFENSES
  // ═══════════════════════════════════════════════════════
  describe("Open Redirect Protection", () => {
    const base = "http://localhost:3000";

    it("accepts valid relative paths", () => {
      expect(isSafeRedirect("/he", { baseUrl: base })).toBe(true);
      expect(isSafeRedirect("/en/papers", { baseUrl: base })).toBe(true);
      expect(isSafeRedirect("/dashboard/settings?tab=general", { baseUrl: base })).toBe(true);
    });

    it("accepts same-origin absolute URLs", () => {
      expect(isSafeRedirect("http://localhost:3000/he", { baseUrl: base })).toBe(true);
      expect(isSafeRedirect("http://localhost:3000/en/papers/5", { baseUrl: base })).toBe(true);
    });

    it("blocks protocol-relative URLs", () => {
      expect(isSafeRedirect("//evil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("///evil.com", { baseUrl: base })).toBe(false);
    });

    it("blocks backslash bypass attempts", () => {
      expect(isSafeRedirect("/\\evil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("/\\\\evil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("\\\\evil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("/%5cevil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("/%2fevil.com", { baseUrl: base })).toBe(false);
    });

    it("blocks dangerous schemes", () => {
      expect(isSafeRedirect("javascript:alert(1)", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("data:text/html;base64,PHNjcmlwdD4=", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("vbscript:msgbox", { baseUrl: base })).toBe(false);
    });

    it("blocks CRLF injection and control characters", () => {
      expect(isSafeRedirect("/he\r\nLocation: http://evil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("/he%0d%0aLocation: http://evil.com", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("/he\0evil", { baseUrl: base })).toBe(false);
    });

    it("blocks third-party domains unless explicitly whitelisted", () => {
      expect(isSafeRedirect("https://attacker.com/steal", { baseUrl: base })).toBe(false);
      expect(isSafeRedirect("https://trusted-partner.com", {
        baseUrl: base,
        allowedOrigins: ["https://trusted-partner.com"],
      })).toBe(true);
    });

    it("getSafeRedirectUrl returns fallback for malicious inputs", () => {
      expect(getSafeRedirectUrl("//evil.com", { baseUrl: base, fallbackUrl: "/he" })).toBe("/he");
      expect(getSafeRedirectUrl("/\\evil.com", { baseUrl: base, fallbackUrl: "/he" })).toBe("/he");
      expect(getSafeRedirectUrl("https://evil.com", { baseUrl: base, fallbackUrl: "/he" })).toBe("/he");
      expect(getSafeRedirectUrl(null, { baseUrl: base, fallbackUrl: "/he" })).toBe("/he");
      expect(getSafeRedirectUrl(undefined, { baseUrl: base, fallbackUrl: "/he" })).toBe("/he");
      expect(getSafeRedirectUrl("/en/papers", { baseUrl: base, fallbackUrl: "/he" })).toBe("/en/papers");
    });
  });

  // ═══════════════════════════════════════════════════════
  // 2. SECURITY HEADERS (CSP, HSTS)
  // ═══════════════════════════════════════════════════════
  describe("Security Headers", () => {
    it("generates baseline headers in development", () => {
      const headers = getSecurityHeaders({ isProduction: false });
      expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
      expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["Strict-Transport-Security"]).toBeUndefined();
    });

    it("enforces HSTS in production", () => {
      const headers = getSecurityHeaders({ isProduction: true });
      expect(headers["Strict-Transport-Security"]).toBe(
        "max-age=31536000; includeSubDomains; preload"
      );
    });

    it("formats headers array for NextConfig", () => {
      const arr = getSecurityHeadersArray({ isProduction: true });
      expect(arr.some((h) => h.key === "Content-Security-Policy")).toBe(true);
      expect(arr.some((h) => h.key === "Strict-Transport-Security")).toBe(true);
      expect(arr.some((h) => h.key === "X-Content-Type-Options")).toBe(true);
    });

    it("applies headers to a Headers instance", () => {
      const headers = new Headers();
      applySecurityHeaders(headers, { isProduction: true });
      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headers.get("X-Frame-Options")).toBe("DENY");
      expect(headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    });
  });

  // ═══════════════════════════════════════════════════════
  // 3. CSRF PROTECTION ON API ROUTES
  // ═══════════════════════════════════════════════════════
  describe("CSRF Protection", () => {
    it("permits safe HTTP methods without checks", () => {
      const getReq = new Request("http://localhost:3000/api/papers", { method: "GET" });
      const headReq = new Request("http://localhost:3000/api/papers", { method: "HEAD" });
      expect(validateCsrf(getReq).isAllowed).toBe(true);
      expect(validateCsrf(headReq).isAllowed).toBe(true);
    });

    it("exempts webhooks and NextAuth routes", () => {
      expect(isRouteExemptFromCsrf("/api/webhooks/stripe")).toBe(true);
      expect(isRouteExemptFromCsrf("/api/webhooks/email")).toBe(true);
      expect(isRouteExemptFromCsrf("/api/inngest")).toBe(true);
      expect(isRouteExemptFromCsrf("/api/auth/signin")).toBe(true);
      expect(isRouteExemptFromCsrf("/api/papers")).toBe(false);

      const webhookReq = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        headers: { origin: "https://stripe.com" },
      });
      expect(validateCsrf(webhookReq).isAllowed).toBe(true);
    });

    it("blocks cross-site browser requests via Sec-Fetch-Site", () => {
      const crossSiteReq = new Request("http://localhost:3000/api/papers", {
        method: "POST",
        headers: {
          "sec-fetch-site": "cross-site",
          origin: "http://localhost:3000",
        },
      });
      const result = validateCsrf(crossSiteReq);
      expect(result.isAllowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it("blocks state-changing requests from untrusted origins", () => {
      const evilReq = new Request("http://localhost:3000/api/papers", {
        method: "POST",
        headers: {
          origin: "https://evil-attacker.com",
          host: "localhost:3000",
        },
      });
      const result = validateCsrf(evilReq);
      expect(result.isAllowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it("blocks state-changing requests with spoofed referer", () => {
      const evilRefererReq = new Request("http://localhost:3000/api/submissions", {
        method: "POST",
        headers: {
          referer: "https://evil-attacker.com/malicious-page",
          host: "localhost:3000",
        },
      });
      const result = validateCsrf(evilRefererReq);
      expect(result.isAllowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it("allows valid same-origin POST requests", () => {
      const validReq = new Request("http://localhost:3000/api/papers", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        },
      });
      expect(validateCsrf(validReq).isAllowed).toBe(true);
    });

    it("generates and verifies HMAC CSRF tokens", async () => {
      const token = await generateCsrfToken("user_session_1", "test-secret");
      expect(await verifyCsrfToken(token, "user_session_1", "test-secret")).toBe(true);
      expect(await verifyCsrfToken(token, "different_session", "test-secret")).toBe(false);
      expect(await verifyCsrfToken(token, "user_session_1", "wrong-secret")).toBe(false);
      expect(await verifyCsrfToken("malformed-token", "user_session_1", "test-secret")).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. ENCRYPTION & TOKEN PROTECTION
  // ═══════════════════════════════════════════════════════
  describe("Encryption & Secret Masking", () => {
    it("encrypts and decrypts strings correctly", () => {
      const secret = "my-super-secret-api-token-12345";
      const encrypted = encrypt(secret);
      expect(isEncrypted(encrypted)).toBe(true);
      expect(encrypted).not.toContain(secret);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(secret);
    });

    it("correctly identifies unencrypted values", () => {
      expect(isEncrypted("dummy")).toBe(false);
      expect(isEncrypted("sk-proj-123456")).toBe(false);
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted("")).toBe(false);
    });

    it("safeDecrypt recovers gracefully without throwing on invalid input", () => {
      expect(safeDecrypt("dummy", "fallback")).toBe("dummy");
      expect(safeDecrypt(null, "fallback")).toBe("fallback");
      const encrypted = encrypt("valid-content");
      expect(safeDecrypt(encrypted)).toBe("valid-content");
    });

    it("masks secrets for safe display or logging", () => {
      expect(maskSecret("sk-1234567890abcdef")).toBe("sk-1...cdef");
      expect(maskSecret("short")).toBe("******");
      expect(maskSecret("")).toBe("");
    });
  });
});
