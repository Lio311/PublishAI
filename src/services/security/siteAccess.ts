import { createHmac, timingSafeEqual } from "crypto";

/**
 * Server-side site PIN gate. The PIN is compared on the server and access is
 * remembered in a signed, httpOnly cookie, so the PIN never ships in the client
 * bundle and the gate cannot be bypassed by editing localStorage.
 */

export const SITE_ACCESS_COOKIE = "publishai_site_access";
export const SITE_ACCESS_TTL_SECONDS = 24 * 60 * 60;

/** SITE_PIN is server-only. NEXT_PUBLIC_SITE_PIN is honored for existing deployments. */
export function getSitePin(): string | null {
  return process.env.SITE_PIN || process.env.NEXT_PUBLIC_SITE_PIN || null;
}

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to sign site access cookies");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(`site-access:${payload}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSiteAccessToken(now = Date.now()): string {
  const expiresAt = String(now + SITE_ACCESS_TTL_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidSiteAccessToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < now) return false;
  return safeEqual(signature, sign(expiresAt));
}

export function isCorrectPin(candidate: unknown): boolean {
  const pin = getSitePin();
  return typeof candidate === "string" && pin !== null && safeEqual(candidate, pin);
}
