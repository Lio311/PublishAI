import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/services/security/rateLimit";

describe("Security Rate Limiter (src/services/security/rateLimit.ts)", () => {
  it("should allow requests within rate limit", () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 250) + 1}`;
    const req = new Request("https://example.com/api/agents/run", {
      headers: { "x-forwarded-for": ip },
    });

    const options = { maxRequests: 3, windowMs: 10_000, keyPrefix: "test-allow" };
    const r1 = checkRateLimit(req, options);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.resetMs).toBe(0);

    const r2 = checkRateLimit(req, options);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(req, options);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("should block requests exceeding the limit and calculate resetMs", () => {
    const ip = `10.0.1.${Math.floor(Math.random() * 250) + 1}`;
    const req = new Request("https://example.com/api/agents/run", {
      headers: { "x-real-ip": ip },
    });

    const options = { maxRequests: 2, windowMs: 5_000, keyPrefix: "test-block" };
    checkRateLimit(req, options);
    checkRateLimit(req, options);

    const blocked = checkRateLimit(req, options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
    expect(blocked.resetMs).toBeLessThanOrEqual(5_000);
  });

  it("should generate a proper 429 response with Retry-After", async () => {
    const res = rateLimitResponse(2500);
    expect(res.status).toBe(429);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Retry-After")).toBe("3");

    const body = await res.json();
    expect(body.error).toBe("Too Many Requests");
    expect(body.retryAfter).toBe(3);
  });

  it("should verify RATE_LIMITS presets exist and have sensible values", () => {
    expect(RATE_LIMITS.agentRun).toEqual({
      maxRequests: 5,
      windowMs: 60_000,
      keyPrefix: "agent-run",
    });
    expect(RATE_LIMITS.literatureSearch.maxRequests).toBe(20);
    expect(RATE_LIMITS.auth.maxRequests).toBe(10);
    expect(RATE_LIMITS.general.maxRequests).toBe(60);
    expect(RATE_LIMITS.upload.maxRequests).toBe(10);
  });

  it("handles x-forwarded-for chain properly", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" },
    });
    const options = { maxRequests: 1, windowMs: 10_000, keyPrefix: "test-ip" };
    const r1 = checkRateLimit(req, options);
    expect(r1.allowed).toBe(true);

    // Another request from same first IP should be blocked
    const reqSame = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "198.51.100.1, 192.168.1.1" },
    });
    const r2 = checkRateLimit(reqSame, options);
    expect(r2.allowed).toBe(false);
  });
});
