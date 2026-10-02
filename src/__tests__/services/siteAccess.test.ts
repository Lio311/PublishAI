/**
 * @jest-environment node
 */
import {
  createSiteAccessToken,
  getSitePin,
  isCorrectPin,
  isValidSiteAccessToken,
  SITE_ACCESS_TTL_SECONDS,
} from "@/services/security/siteAccess";

describe("site access gate", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
    process.env.SITE_PIN = "4321";
    delete process.env.NEXT_PUBLIC_SITE_PIN;
  });

  afterAll(() => {
    process.env = env;
  });

  it("is disabled when no PIN is configured", () => {
    delete process.env.SITE_PIN;
    expect(getSitePin()).toBeNull();
    expect(isCorrectPin("2580")).toBe(false);
  });

  it("checks the PIN on the server", () => {
    expect(isCorrectPin("4321")).toBe(true);
    expect(isCorrectPin("2580")).toBe(false);
    expect(isCorrectPin(4321)).toBe(false);
  });

  it("accepts its own signed token until it expires", () => {
    const now = Date.now();
    const token = createSiteAccessToken(now);
    expect(isValidSiteAccessToken(token, now + 1000)).toBe(true);
    expect(isValidSiteAccessToken(token, now + SITE_ACCESS_TTL_SECONDS * 1000 + 1)).toBe(false);
  });

  it("rejects forged or tampered tokens", () => {
    const [expiresAt] = createSiteAccessToken().split(".");
    expect(isValidSiteAccessToken(`${Number(expiresAt) + 10_000_000}.forged`)).toBe(false);
    expect(isValidSiteAccessToken(undefined)).toBe(false);

    process.env.AUTH_SECRET = "other-secret";
    const [, signature] = createSiteAccessToken().split(".");
    process.env.AUTH_SECRET = "test-secret";
    expect(isValidSiteAccessToken(`${expiresAt}.${signature}`)).toBe(false);
  });
});
