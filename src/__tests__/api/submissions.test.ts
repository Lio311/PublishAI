import { POST as createSubmission, GET as listSubmissions } from "@/app/api/submissions/route";
import { POST as solveCaptcha } from "@/app/api/submissions/captcha/route";
import { POST as triggerSubmit } from "@/app/api/submissions/[id]/submit/route";
import { GET as getStatus, PATCH as updateStatus } from "@/app/api/submissions/[id]/status/route";
import { POST as cascadeSubmission } from "@/app/api/submissions/[id]/cascade/route";
import { POST as processReviews } from "@/app/api/submissions/[id]/reviews/process/route";
import { NextRequest } from "next/server";

// Mock auth
const mockSession: { user: { id: string; email: string } | null } = {
  user: { id: "user_test_123", email: "user@example.com" },
};

jest.mock("@/app/auth", () => ({
  auth: jest.fn(() => Promise.resolve(mockSession)),
}));

// Mock inngest
jest.mock("@/inngest/client", () => ({
  inngest: {
    send: jest.fn().mockResolvedValue({ ids: ["event-1"] }),
  },
}));

// Mock db
const mockPapers: Record<number, any> = {
  1: { id: 1, userId: "user_test_123", title: "My Paper", cascadeQueue: ["10", "20"] },
  2: { id: 2, userId: "user_other_456", title: "Other Paper", cascadeQueue: ["10"] },
  3: { id: 3, userId: "user_test_123", title: "Empty Queue Paper", cascadeQueue: [] },
};

const mockConnections: Record<number, any> = {
  100: { id: 100, userId: "user_test_123", journalId: 10, siteUrl: "https://example.com" },
  200: { id: 200, userId: "user_other_456", journalId: 10, siteUrl: "https://example.com" },
};

const mockSubmissions: Record<number, any> = {
  10: { id: 10, paperId: 1, connectionId: 100, userId: "user_test_123", status: "preparing", cascadeQueue: [] },
  20: { id: 20, paperId: 2, connectionId: 200, userId: "user_other_456", status: "preparing" },
};

jest.mock("@/services/db", () => {
  return {
    db: {
      query: {
        papers: {
          findFirst: jest.fn(async ({ where }: any) => {
            // Find paper by ID from mockPapers
            for (const p of Object.values(mockPapers)) {
              return p; // Default resolver overridden in tests if needed
            }
            return null;
          }),
        },
        journalConnections: {
          findFirst: jest.fn(async () => mockConnections[100]),
        },
        submissions: {
          findFirst: jest.fn(async () => mockSubmissions[10]),
          findMany: jest.fn(async () => [mockSubmissions[10]]),
        },
      },
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([{ id: 99, status: "preparing" }]),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ id: 10 }]),
        })),
      })),
      transaction: jest.fn(async (cb) => {
        return cb({
          update: jest.fn(() => ({
            set: jest.fn(() => ({
              where: jest.fn().mockResolvedValue([]),
            })),
          })),
          query: {
            journalConnections: {
              findFirst: jest.fn().mockResolvedValue(mockConnections[100]),
            },
          },
          insert: jest.fn(() => ({
            values: jest.fn(() => ({
              returning: jest.fn().mockResolvedValue([{ id: 999, status: "draft" }]),
            })),
          })),
        });
      }),
    },
  };
});

// Mock rate limit
jest.mock("@/services/rate-limit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 10 }),
}));

// Mock reviewService
jest.mock("@/services/reviews/reviewService", () => ({
  reviewService: {
    processReviewComments: jest.fn().mockResolvedValue({
      summary: "Review summary",
      totalComments: 1,
      comments: [
        {
          reviewerId: "Reviewer 1",
          pointNumber: 1,
          comment: "Methodology unclear",
          category: "methodology",
          severity: "major",
          suggestedAction: "Clarify methods",
          draftResponse: "We have clarified the methods section.",
        },
      ],
    }),
  },
}));

describe("Submissions API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.user = { id: "user_test_123", email: "user@example.com" };
  });

  describe("POST /api/submissions", () => {
    it("returns 401 when not authenticated", async () => {
      mockSession.user = null;
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({ paperId: 1, connectionId: 100 }),
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid json or missing fields", async () => {
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: "invalid-json",
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 on missing paperId or connectionId", async () => {
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({ paperId: 1 }),
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 when paper is not found", async () => {
      const { db } = require("@/services/db");
      db.query.papers.findFirst.mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({ paperId: 999, connectionId: 100 }),
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(404);
    });

    it("returns 403 when paper belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.papers.findFirst.mockResolvedValueOnce({ id: 2, userId: "user_other_456" });

      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({ paperId: 2, connectionId: 100 }),
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(403);
    });

    it("returns 403 when connection belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.papers.findFirst.mockResolvedValueOnce({ id: 1, userId: "user_test_123" });
      db.query.journalConnections.findFirst.mockResolvedValueOnce({ id: 200, userId: "user_other_456" });

      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({ paperId: 1, connectionId: 200 }),
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(403);
    });

    it("returns 202 on valid creation", async () => {
      const { db } = require("@/services/db");
      db.query.papers.findFirst.mockResolvedValueOnce({ id: 1, userId: "user_test_123" });
      db.query.journalConnections.findFirst.mockResolvedValueOnce({ id: 100, userId: "user_test_123" });

      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({ paperId: 1, connectionId: 100, publishMode: "draft" }),
      });
      const res = await createSubmission(req);
      expect(res.status).toBe(202);
      const data = await res.json();
      expect(data.id).toBe(99);
    });
  });

  describe("GET /api/submissions", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSession.user = null;
      const res = await listSubmissions();
      expect(res.status).toBe(401);
    });

    it("returns 200 with list of submissions", async () => {
      const res = await listSubmissions();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("POST /api/submissions/captcha", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSession.user = null;
      const req = new Request("http://localhost/api/submissions/captcha", {
        method: "POST",
        body: JSON.stringify({ submissionId: 10, solution: "abc123" }),
      });
      const res = await solveCaptcha(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when fields are missing", async () => {
      const req = new Request("http://localhost/api/submissions/captcha", {
        method: "POST",
        body: JSON.stringify({ submissionId: 10 }),
      });
      const res = await solveCaptcha(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 when submission not found", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/submissions/captcha", {
        method: "POST",
        body: JSON.stringify({ submissionId: 999, solution: "abc" }),
      });
      const res = await solveCaptcha(req);
      expect(res.status).toBe(404);
    });

    it("returns 403 when submission belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 20, userId: "user_other_456" });

      const req = new Request("http://localhost/api/submissions/captcha", {
        method: "POST",
        body: JSON.stringify({ submissionId: 20, solution: "abc" }),
      });
      const res = await solveCaptcha(req);
      expect(res.status).toBe(403);
    });

    it("returns 200 and sends inngest event when authorized", async () => {
      const { db } = require("@/services/db");
      const { inngest } = require("@/inngest/client");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, userId: "user_test_123" });

      const req = new Request("http://localhost/api/submissions/captcha", {
        method: "POST",
        body: JSON.stringify({ submissionId: 10, solution: "captcha-solution" }),
      });
      const res = await solveCaptcha(req);
      expect(res.status).toBe(200);
      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "submission/captcha-solved",
          data: { submissionId: 10, solution: "captcha-solution" },
        })
      );
    });
  });

  describe("POST /api/submissions/[id]/submit", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSession.user = null;
      const req = new NextRequest("http://localhost/api/submissions/10/submit");
      const res = await triggerSubmit(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid ID", async () => {
      const req = new NextRequest("http://localhost/api/submissions/abc/submit");
      const res = await triggerSubmit(req, { params: Promise.resolve({ id: "abc" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when submission does not exist", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/submissions/999/submit");
      const res = await triggerSubmit(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 when submission belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 20, userId: "user_other_456" });

      const req = new NextRequest("http://localhost/api/submissions/20/submit");
      const res = await triggerSubmit(req, { params: Promise.resolve({ id: "20" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 when authorized and triggers Inngest", async () => {
      const { db } = require("@/services/db");
      const { inngest } = require("@/inngest/client");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, userId: "user_test_123" });

      const req = new NextRequest("http://localhost/api/submissions/10/submit");
      const res = await triggerSubmit(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(200);
      expect(inngest.send).toHaveBeenCalledWith({
        name: "submission/process",
        data: { submissionId: 10 },
      });
    });
  });

  describe("GET & PATCH /api/submissions/[id]/status", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSession.user = null;
      const req = new NextRequest("http://localhost/api/submissions/10/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(401);
    });

    it("returns 404 on GET when submission does not exist", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/submissions/999/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 on GET when submission belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 20, userId: "user_other_456" });

      const req = new NextRequest("http://localhost/api/submissions/20/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "20" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 on GET when authorized", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, userId: "user_test_123", status: "preparing" });

      const req = new NextRequest("http://localhost/api/submissions/10/status");
      const res = await getStatus(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(200);
    });

    it("returns 404 on PATCH when submission does not exist", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/submissions/999/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "submitted" }),
      });
      const res = await updateStatus(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 on PATCH when submission belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 20, userId: "user_other_456" });

      const req = new NextRequest("http://localhost/api/submissions/20/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "submitted" }),
      });
      const res = await updateStatus(req, { params: Promise.resolve({ id: "20" }) });
      expect(res.status).toBe(403);
    });

    it("returns 400 on PATCH when status is invalid or missing", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, userId: "user_test_123" });

      const req = new NextRequest("http://localhost/api/submissions/10/status", {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const res = await updateStatus(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/submissions/[id]/cascade", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSession.user = null;
      const req = new Request("http://localhost/api/submissions/10/cascade", { method: "POST" });
      const res = await cascadeSubmission(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(401);
    });

    it("returns 404 when submission does not exist", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/submissions/999/cascade", { method: "POST" });
      const res = await cascadeSubmission(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 when submission belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 20, userId: "user_other_456" });

      const req = new Request("http://localhost/api/submissions/20/cascade", { method: "POST" });
      const res = await cascadeSubmission(req, { params: Promise.resolve({ id: "20" }) });
      expect(res.status).toBe(403);
    });

    it("returns 403 when paper belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, paperId: 2, userId: "user_test_123" });
      db.query.papers.findFirst.mockResolvedValueOnce({ id: 2, userId: "user_other_456" });

      const req = new Request("http://localhost/api/submissions/10/cascade", { method: "POST" });
      const res = await cascadeSubmission(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(403);
    });

    it("returns 400 when cascade queue is empty", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, paperId: 3, userId: "user_test_123" });
      db.query.papers.findFirst.mockResolvedValueOnce({ id: 3, userId: "user_test_123", cascadeQueue: [] });

      const req = new Request("http://localhost/api/submissions/10/cascade", { method: "POST" });
      const res = await cascadeSubmission(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(400);
    });

    it("returns 201 on successful cascade", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({
        id: 10,
        paperId: 1,
        userId: "user_test_123",
        connection: { journalId: 5 },
      });
      db.query.papers.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: "user_test_123",
        cascadeQueue: ["10", "20"],
      });

      const req = new Request("http://localhost/api/submissions/10/cascade", { method: "POST" });
      const res = await cascadeSubmission(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(201);
    });
  });

  describe("POST /api/submissions/[id]/reviews/process", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSession.user = null;
      const req = new Request("http://localhost/api/submissions/10/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "Review comments" }),
      });
      const res = await processReviews(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(401);
    });

    it("returns 404 when submission does not exist", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/submissions/999/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "Review comments" }),
      });
      const res = await processReviews(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 when submission belongs to another user", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 20, userId: "user_other_456" });

      const req = new Request("http://localhost/api/submissions/20/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "Review comments" }),
      });
      const res = await processReviews(req, { params: Promise.resolve({ id: "20" }) });
      expect(res.status).toBe(403);
    });

    it("returns 400 when comments text is empty", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, userId: "user_test_123" });

      const req = new Request("http://localhost/api/submissions/10/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "" }),
      });
      const res = await processReviews(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(400);
    });

    it("returns 200 and processes reviews when authorized", async () => {
      const { db } = require("@/services/db");
      db.query.submissions.findFirst.mockResolvedValueOnce({ id: 10, userId: "user_test_123" });

      const req = new Request("http://localhost/api/submissions/10/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "Reviewer 1: The methodology requires clarification." }),
      });
      const res = await processReviews(req, { params: Promise.resolve({ id: "10" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.comments.length).toBe(1);
    });
  });
});
