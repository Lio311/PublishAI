import { GET as getPapers, POST as createPaper } from "@/app/api/papers/route";
import { GET as getPaper, PATCH as updatePaper, DELETE as deletePaper } from "@/app/api/papers/[id]/route";
import { GET as getFigures } from "@/app/api/papers/[id]/figures/route";
import { GET as getSandbox } from "@/app/api/papers/[id]/sandbox/route";
import { POST as predictPaper } from "@/app/api/papers/[id]/predict/route";
import { NextRequest } from "next/server";

// Mock auth
const mockSession: { user: { id: string; email: string } | null } = {
  user: { id: "user_test_123", email: "author@example.com" },
};

jest.mock("@/app/auth", () => ({
  auth: jest.fn(() => Promise.resolve(mockSession)),
}));

// Mock rate limit
jest.mock("@/services/rate-limit", () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 10 }),
}));

// Mock acceptance predictor
jest.mock("@/services/ai/acceptance-predictor", () => ({
  predictAcceptance: jest.fn().mockResolvedValue({
    probabilityScore: 85,
    reasoning: "Strong methodology",
    strengths: ["Clear results"],
    weaknesses: ["Small sample size"],
    recommendations: ["Expand dataset"],
  }),
}));

// Mock Data
const mockPapers: Record<number, any> = {
  1: {
    id: 1,
    userId: "user_test_123",
    title: "Quantum Gravity Review",
    status: "pending",
    targetJournalId: 10,
    createdAt: new Date(),
    targetJournal: { id: 10, name: "Nature Physics", field: "Physics" },
  },
  2: {
    id: 2,
    userId: "user_other_456",
    title: "Private Research",
    status: "in_progress",
    targetJournalId: null,
    createdAt: new Date(),
  },
};

const mockJournals: Record<number, any> = {
  10: {
    id: 10,
    name: "Nature Physics",
    field: "Physics",
    rules: {},
    requiredSections: ["Introduction", "Methods", "Results"],
  },
};

const mockSandboxRuns: Record<number, any> = {
  1: { id: "run-uuid-1", paperId: 1, status: "completed", createdAt: new Date() },
};

const mockFigures = [
  { id: "fig-1", paperId: 1, figureNumber: 1, imageUrl: "https://example.com/fig1.png" },
];

const mockFigureAnalyses = [
  { id: "ana-1", figureId: "fig-1", legendAccuracyScore: 90 },
];

jest.mock("@/services/db", () => {
  return {
    db: {
      query: {
        papers: {
          findFirst: jest.fn(async ({ where }: any) => {
            return mockPapers[1]; // default, overridden in tests
          }),
          findMany: jest.fn(async () => [mockPapers[1]]),
        },
        journals: {
          findFirst: jest.fn(async () => mockJournals[10]),
        },
        documents: {
          findFirst: jest.fn(async () => ({ abstract: "Test abstract" })),
        },
        submissions: {
          findFirst: jest.fn(async () => ({ keyFindings: "Novel quantum state" })),
        },
      },
      select: jest.fn(() => ({
        from: jest.fn((table: any) => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue([mockSandboxRuns[1]]),
            })),
            mockResolvedValue: jest.fn(),
            then: (resolve: any) => resolve([mockSandboxRuns[1]]),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([
            { id: 3, userId: "user_test_123", title: "New Paper", status: "pending" },
          ]),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              { id: 1, userId: "user_test_123", title: "Updated Paper" },
            ]),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        })),
      })),
    },
  };
});

describe("Papers API Routes Audit Suite", () => {
  const { auth } = require("@/app/auth");
  const { db } = require("@/services/db");

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.user = { id: "user_test_123", email: "author@example.com" };
  });

  describe("GET /api/papers", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers");
      const res = await getPapers(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid query params", async () => {
      const req = new NextRequest("http://localhost/api/papers?page=-5");
      const res = await getPapers(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid query parameters");
    });

    it("returns 400 on invalid status enum parameter", async () => {
      const req = new NextRequest("http://localhost/api/papers?status=not_a_status");
      const res = await getPapers(req);
      expect(res.status).toBe(400);
    });

    it("returns 200 with list of papers for current user", async () => {
      const req = new NextRequest("http://localhost/api/papers?page=1&limit=10&status=pending");
      const res = await getPapers(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("papers");
      expect(data.page).toBe(1);
    });
  });

  describe("POST /api/papers", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers", {
        method: "POST",
        body: JSON.stringify({ title: "My Paper" }),
      });
      const res = await createPaper(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 on malformed JSON", async () => {
      const req = new NextRequest("http://localhost/api/papers", {
        method: "POST",
        body: "invalid-json{",
      });
      const res = await createPaper(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when title is missing", async () => {
      const req = new NextRequest("http://localhost/api/papers", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await createPaper(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid request payload");
    });

    it("returns 400 when targetJournalId does not exist", async () => {
      db.query.journals.findFirst.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers", {
        method: "POST",
        body: JSON.stringify({ title: "Valid Title", targetJournalId: 9999 }),
      });
      const res = await createPaper(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Target journal not found");
    });

    it("returns 201 on valid paper creation", async () => {
      db.query.journals.findFirst.mockResolvedValueOnce(mockJournals[10]);
      const req = new NextRequest("http://localhost/api/papers", {
        method: "POST",
        body: JSON.stringify({ title: "Valid Title", targetJournalId: 10 }),
      });
      const res = await createPaper(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.paper.title).toBe("New Paper");
    });
  });

  describe("GET /api/papers/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/1");
      const res = await getPaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid ID parameter", async () => {
      const req = new NextRequest("http://localhost/api/papers/not-a-number");
      const res = await getPaper(req, { params: Promise.resolve({ id: "not-a-number" }) });
      expect(res.status).toBe(400);
    });

    it("returns 404 when paper not found", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/999");
      const res = await getPaper(req, { params: Promise.resolve({ id: "999" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 when paper belongs to another user", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[2]); // owned by user_other_456
      const req = new NextRequest("http://localhost/api/papers/2");
      const res = await getPaper(req, { params: Promise.resolve({ id: "2" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 when paper belongs to authenticated user", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            orderBy: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });
      const req = new NextRequest("http://localhost/api/papers/1");
      const res = await getPaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.paper.id).toBe(1);
    });
  });

  describe("PATCH /api/papers/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/1", {
        method: "PATCH",
        body: JSON.stringify({ title: "New" }),
      });
      const res = await updatePaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 when paper belongs to another user", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[2]);
      const req = new NextRequest("http://localhost/api/papers/2", {
        method: "PATCH",
        body: JSON.stringify({ title: "Hack Title" }),
      });
      const res = await updatePaper(req, { params: Promise.resolve({ id: "2" }) });
      expect(res.status).toBe(403);
    });

    it("returns 400 on invalid status value", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      const req = new NextRequest("http://localhost/api/papers/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "bogus_status" }),
      });
      const res = await updatePaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(400);
    });

    it("returns 200 on valid update", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      const req = new NextRequest("http://localhost/api/papers/1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Paper", status: "in_progress" }),
      });
      const res = await updatePaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("DELETE /api/papers/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/1", { method: "DELETE" });
      const res = await deletePaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 when paper belongs to another user", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[2]);
      const req = new NextRequest("http://localhost/api/papers/2", { method: "DELETE" });
      const res = await deletePaper(req, { params: Promise.resolve({ id: "2" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 when deleting owned paper", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      const req = new NextRequest("http://localhost/api/papers/1", { method: "DELETE" });
      const res = await deletePaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/papers/[id]/figures", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/1/figures");
      const res = await getFigures(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 when paper belongs to another user", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[2]);
      const req = new NextRequest("http://localhost/api/papers/2/figures");
      const res = await getFigures(req, { params: Promise.resolve({ id: "2" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 with figures and analyses when authorized", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              orderBy: jest.fn().mockResolvedValueOnce(mockFigures),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockResolvedValueOnce(mockFigureAnalyses),
          }),
        });

      const req = new NextRequest("http://localhost/api/papers/1/figures");
      const res = await getFigures(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("figures");
      expect(data.figures[0].analyses).toHaveLength(1);
    });
  });

  describe("GET /api/papers/[id]/sandbox", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/1/sandbox");
      const res = await getSandbox(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 when attempting to access another user paper sandbox", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[2]);
      const req = new NextRequest("http://localhost/api/papers/2/sandbox");
      const res = await getSandbox(req, { params: Promise.resolve({ id: "2" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 with sandbox run and charts when authorized", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              orderBy: jest.fn().mockReturnValueOnce({
                limit: jest.fn().mockResolvedValueOnce([mockSandboxRuns[1]]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockResolvedValueOnce([]),
          }),
        });

      const req = new NextRequest("http://localhost/api/papers/1/sandbox");
      const res = await getSandbox(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.run.id).toBe("run-uuid-1");
    });
  });

  describe("POST /api/papers/[id]/predict", () => {
    it("returns 401 when unauthenticated", async () => {
      auth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/papers/1/predict", { method: "POST" });
      const res = await predictPaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 when paper belongs to another user", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[2]);
      const req = new NextRequest("http://localhost/api/papers/2/predict", { method: "POST" });
      const res = await predictPaper(req, { params: Promise.resolve({ id: "2" }) });
      expect(res.status).toBe(403);
    });

    it("returns 400 when no target journal selected", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce({
        ...mockPapers[1],
        targetJournalId: null,
        targetJournal: null,
      });
      const req = new NextRequest("http://localhost/api/papers/1/predict", { method: "POST" });
      const res = await predictPaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(400);
    });

    it("returns 200 with prediction when authorized", async () => {
      db.query.papers.findFirst.mockResolvedValueOnce(mockPapers[1]);
      db.query.journals.findFirst.mockResolvedValueOnce(mockJournals[10]);
      const req = new NextRequest("http://localhost/api/papers/1/predict", {
        method: "POST",
        body: JSON.stringify({
          abstract: "Override abstract",
        }),
      });
      const res = await predictPaper(req, { params: Promise.resolve({ id: "1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.probabilityScore).toBe(85);
    });
  });
});
