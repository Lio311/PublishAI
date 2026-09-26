import { checkRateLimit, applyRateLimit, getClientIp } from "@/services/rate-limit";

describe("Rate Limiting Service", () => {
  it("should allow requests under the limit", async () => {
    const testId = `user-test-${Date.now()}`;
    const result = await checkRateLimit(testId, "strict"); // 5 requests max
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block requests when the limit is exceeded", async () => {
    const testId = `user-burst-${Date.now()}`;
    // Limit is 5 for "strict" tier
    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(testId, "strict");
      expect(res.success).toBe(true);
    }

    const blockedRes = await checkRateLimit(testId, "strict");
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });

  it("should extract client IP properly", () => {
    const reqWithForwarded = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(reqWithForwarded)).toBe("203.0.113.195");

    const reqWithRealIp = new Request("https://example.com/api/test", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    expect(getClientIp(reqWithRealIp)).toBe("198.51.100.4");

    const reqFallback = new Request("https://example.com/api/test");
    expect(getClientIp(reqFallback)).toBe("127.0.0.1");
  });

  it("applyRateLimit should return 429 response when limit exceeded", async () => {
    const ip = `192.168.1.${Math.floor(Math.random() * 1000)}`;
    const req = new Request("https://example.com/api/test", {
      headers: { "x-real-ip": ip },
    });

    for (let i = 0; i < 5; i++) {
      const res = await applyRateLimit(req, "strict");
      expect(res).toBeNull();
    }

    const blockedRes = await applyRateLimit(req, "strict");
    expect(blockedRes).not.toBeNull();
    expect(blockedRes?.status).toBe(429);
    expect(blockedRes?.headers.get("Retry-After")).toBeDefined();
    expect(blockedRes?.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(blockedRes?.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
