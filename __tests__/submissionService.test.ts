/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import {
  SubmissionService,
  submitPaper,
  recordSubmissionEvent,
  getSubmissionEvents,
  getSubmissionStatus,
  updateSubmissionStatus,
} from "@/services/submission";
import { POST as submitRoute } from "@/app/api/submissions/[id]/submit/route";
import { GET as getStatusRoute, PATCH as patchStatusRoute } from "@/app/api/submissions/[id]/status/route";
import { auth } from "@/app/auth";

// Mock @/app/auth
jest.mock("@/app/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: "test-user-123", email: "author@test.com", name: "Test Author" },
  }),
}));

// Mock @/services/rate-limit
jest.mock("@/services/rate-limit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock @/services/db
const mockSubmissionsMap = new Map<number, any>([
  [
    201,
    {
      id: 201,
      paperId: 42,
      userId: "test-user-123",
      status: "submitted",
      submittedTitle: "Neural Architecture Search for Climate Modeling",
      confirmationId: "SUB-INIT-201",
    },
  ],
]);

jest.mock("@/services/db", () => {
  return {
    db: {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1001 }]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      query: {
        submissions: {
          findFirst: jest.fn().mockImplementation(() => {
            return Promise.resolve(mockSubmissionsMap.get(201));
          }),
        },
      },
    },
  };
});

describe("SubmissionService (Epic 3)", () => {
  beforeEach(() => {
    SubmissionService.clearMemoryStore();
    jest.clearAllMocks();
  });

  describe("recordSubmissionEvent", () => {
    it("records an event and returns formatted SubmissionEvent", async () => {
      const event = await recordSubmissionEvent({
        submissionId: 201,
        paperId: 42,
        eventType: "manuscript_uploaded",
        fromStatus: "draft",
        toStatus: "preparing",
        actor: "author",
        details: { fileName: "manuscript.pdf" },
      });

      expect(event).toBeDefined();
      expect(event.submissionId).toBe(201);
      expect(event.paperId).toBe(42);
      expect(event.eventType).toBe("manuscript_uploaded");
      expect(event.actor).toBe("author");
      expect(event.details).toEqual({ fileName: "manuscript.pdf" });
    });

    it("retrieves recorded submission events for a submission", async () => {
      await recordSubmissionEvent({
        submissionId: 201,
        eventType: "event_1",
        actor: "system",
      });
      await recordSubmissionEvent({
        submissionId: 201,
        eventType: "event_2",
        actor: "author",
      });

      const events = await getSubmissionEvents(201);
      expect(events.length).toBeGreaterThanOrEqual(2);
      const types = events.map((e) => e.eventType);
      expect(types).toContain("event_1");
      expect(types).toContain("event_2");
    });
  });

  describe("submitPaper", () => {
    it("submits a paper, transitions status to submitted, and records event", async () => {
      SubmissionService.registerMockSubmission({
        id: 201,
        paperId: 42,
        userId: "test-user-123",
        status: "preparing",
      });

      const result = await submitPaper(201, {
        userId: "test-user-123",
        notes: "Initial submission to Nature",
        targetJournalId: 10,
        publishMode: "publish",
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe(201);
      expect(result.status).toBe("submitted");
      expect(result.confirmationId).toBeDefined();
      expect(result.event).toBeDefined();
      expect(result.event?.eventType).toBe("paper_submitted");
      expect(result.event?.toStatus).toBe("submitted");
    });

    it("accepts an options object as the only argument", async () => {
      const result = await submitPaper({
        submissionId: 202,
        paperId: 55,
        userId: "test-user-123",
        notes: "Direct options call",
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe(202);
      expect(result.paperId).toBe(55);
      expect(result.status).toBe("submitted");
    });
  });

  describe("updateSubmissionStatus", () => {
    it("updates submission status and records status_changed event", async () => {
      SubmissionService.registerMockSubmission({
        id: 201,
        status: "submitted",
      });

      const result = await updateSubmissionStatus(201, "under_review", {
        actor: "editor",
        notes: "Sent to 2 external reviewers",
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.event?.eventType).toBe("status_changed");
      expect(result.event?.toStatus).toBe("under_review");
    });
  });

  describe("API Route: POST /api/submissions/[id]/submit", () => {
    it("submits manuscript successfully", async () => {
      const req = new NextRequest("http://localhost/api/submissions/201/submit", {
        method: "POST",
        body: JSON.stringify({ notes: "Ready for review" }),
      });

      const res = await submitRoute(req, {
        params: Promise.resolve({ id: "201" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.submission.status).toBe("submitted");
    });

    it("returns 400 for invalid ID parameter", async () => {
      const req = new NextRequest("http://localhost/api/submissions/abc/submit", {
        method: "POST",
      });

      const res = await submitRoute(req, {
        params: Promise.resolve({ id: "abc" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid submission ID");
    });

    it("returns 401 when unauthenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost/api/submissions/201/submit", {
        method: "POST",
      });

      const res = await submitRoute(req, {
        params: Promise.resolve({ id: "201" }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("API Route: GET & PATCH /api/submissions/[id]/status", () => {
    it("GET returns tracking summary and events", async () => {
      await recordSubmissionEvent({
        submissionId: 201,
        eventType: "paper_submitted",
        toStatus: "submitted",
      });

      const req = new NextRequest("http://localhost/api/submissions/201/status");
      const res = await getStatusRoute(req, {
        params: Promise.resolve({ id: "201" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.submissionId).toBe(201);
      expect(Array.isArray(data.events)).toBe(true);
    });

    it("PATCH updates status and returns 200", async () => {
      const req = new NextRequest("http://localhost/api/submissions/201/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: "under_review",
          notes: "Reviewers assigned",
          force: true,
        }),
      });

      const res = await patchStatusRoute(req, {
        params: Promise.resolve({ id: "201" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe("under_review");
    });

    it("PATCH returns 400 if status is missing", async () => {
      const req = new NextRequest("http://localhost/api/submissions/201/status", {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      const res = await patchStatusRoute(req, {
        params: Promise.resolve({ id: "201" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Missing required field: status");
    });
  });
});
