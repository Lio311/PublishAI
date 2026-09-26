import { GET as getMe, PATCH as patchMe } from "@/app/api/auth/me/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { GET as clearSession } from "@/app/api/auth/clear-session/route";

// Mock rate limiting
jest.mock("@/services/rate-limit", () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
}));

// Mock db-helper
let mockSafeAuth: any = null;
let mockSafeDb: any = null;

jest.mock("@/services/api/db-helper", () => ({
  getSafeAuth: jest.fn(() => Promise.resolve(mockSafeAuth)),
  getSafeDb: jest.fn(() => Promise.resolve(mockSafeDb)),
}));

// Mock cookies for clear-session
const mockCookieStore = {
  getAll: jest.fn(() => [
    { name: "authjs.session-token", value: "tok_1" },
    { name: "next-auth.session-token", value: "tok_2" },
    { name: "other-cookie", value: "val" },
  ]),
};

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

describe("Auth API Routes Audit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSafeAuth = null;
    mockSafeDb = null;
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSafeAuth = null;
      const req = new Request("http://localhost:3000/api/auth/me");
      const res = await getMe(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.authenticated).toBe(false);
    });

    it("returns sanitized session user when authenticated", async () => {
      mockSafeAuth = {
        user: {
          id: "usr_123",
          name: "Dr. Jane",
          email: "jane@university.edu",
        },
      };
      const req = new Request("http://localhost:3000/api/auth/me");
      const res = await getMe(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(true);
      expect(json.user.id).toBe("usr_123");
      expect(json.user.email).toBe("jane@university.edu");
      // Ensure sensitive stripe fields are NOT exposed
      expect(json.user.stripeCustomerId).toBeUndefined();
      expect(json.user.stripeSubscriptionId).toBeUndefined();
    });

    it("sanitizes database user data and does not expose stripe IDs", async () => {
      mockSafeAuth = {
        user: { id: "usr_db_user" },
      };
      mockSafeDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            id: "usr_db_user",
            name: "Prof. Smith",
            email: "smith@oxford.edu",
            image: "https://avatar.com/smith.jpg",
            emailVerified: new Date(),
            stripeCustomerId: "cus_secret_12345",
            stripeSubscriptionId: "sub_secret_67890",
            stripePriceId: "price_abc",
            credits: 5,
          },
        ]),
      };

      const req = new Request("http://localhost:3000/api/auth/me");
      const res = await getMe(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.id).toBe("usr_db_user");
      expect(json.user.credits).toBe(5);
      // Verify sensitive stripe fields are stripped
      expect(json.user.stripeCustomerId).toBeUndefined();
      expect(json.user.stripeSubscriptionId).toBeUndefined();
      expect(json.user.stripePriceId).toBeUndefined();
    });
  });

  describe("PATCH /api/auth/me", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSafeAuth = null;
      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const res = await patchMe(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 on malformed JSON payload", async () => {
      mockSafeAuth = { user: { id: "usr_123" } };
      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "PATCH",
        body: "{malformed_json",
      });
      const res = await patchMe(req);
      expect(res.status).toBe(400);
    });

    it("sanitizes updated user response and does not leak DB fields", async () => {
      mockSafeAuth = { user: { id: "usr_123" } };
      mockSafeDb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "usr_123",
            name: "Updated Dr. Jane",
            email: "jane@university.edu",
            image: "https://avatar.com/new.jpg",
            stripeCustomerId: "cus_secret_12345",
            credits: 10,
          },
        ]),
      };

      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Dr. Jane" }),
      });
      const res = await patchMe(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.name).toBe("Updated Dr. Jane");
      expect(json.user.stripeCustomerId).toBeUndefined();
    });
  });

  describe("POST /api/auth/register", () => {
    it("returns 400 when email is invalid or missing", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "invalid-email" }),
      });
      const res = await registerUser(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 on invalid JSON body", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: "bad json",
      });
      const res = await registerUser(req);
      expect(res.status).toBe(400);
    });

    it("sanitizes user output on successful registration", async () => {
      mockSafeDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "usr_reg_new",
            name: "Alice",
            email: "alice@example.com",
            credits: 3,
            stripeCustomerId: "cus_private",
          },
        ]),
      };

      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "alice@example.com",
          name: "Alice",
          institution: "MIT",
        }),
      });
      const res = await registerUser(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.id).toBe("usr_reg_new");
      expect(json.user.stripeCustomerId).toBeUndefined();
    });
  });

  describe("GET /api/auth/clear-session", () => {
    it("clears session tokens and redirects safely", async () => {
      const req = new Request("http://localhost:3000/api/auth/clear-session");
      const res = await clearSession(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/he");
    });

    it("prevents open redirect attacks", async () => {
      const req = new Request("http://localhost:3000/api/auth/clear-session?redirect=//evil.com");
      const res = await clearSession(req);
      expect(res.status).toBe(307);
      // Must not redirect to evil.com
      expect(res.headers.get("location")).toBe("http://localhost:3000/he");
    });

    it("allows valid relative redirects", async () => {
      const req = new Request("http://localhost:3000/api/auth/clear-session?redirect=/en/login");
      const res = await clearSession(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/en/login");
    });
  });
});
