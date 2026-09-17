/**
 * @jest-environment node
 */
import { reviewService, processReviewComments, fallbackParseReviewComments } from "@/services/reviews/reviewService";
import { POST as processReviewsRoute } from "@/app/api/submissions/[id]/reviews/process/route";
import * as aiService from "@/services/ai/aiService";

// Mock AI service methods
jest.mock("@/services/ai/aiService", () => ({
  generateObject: jest.fn(),
  generateText: jest.fn(),
  getOpenAIModelInstance: jest.fn().mockReturnValue({ modelId: "gpt-4o" }),
  callLLM: jest.fn(),
}));

// Mock Database
const mockInsertValues = jest.fn().mockResolvedValue([{ id: 1 }]);
const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
const mockExecute = jest.fn().mockResolvedValue([{ count: 1 }]);

jest.mock("@/db", () => ({
  db: {
    insert: (...args: any[]) => mockInsert(...args),
    execute: (...args: any[]) => mockExecute(...args),
  },
}));

jest.mock("@/db/schema", () => ({
  reviewComments: {
    name: "review_comments",
  },
}));

describe("Epic 3: Review Response Service & API", () => {
  const mockGenerateObject = aiService.generateObject as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reviewService.processReviewComments", () => {
    it("returns empty result when rawText is empty or whitespace", async () => {
      const result = await reviewService.processReviewComments("");
      expect(result.comments).toEqual([]);
      expect(result.totalComments).toBe(0);
      expect(result.summary).toContain("No reviewer comments provided");
    });

    it("uses AI generateObject when available to parse discrete points and draft responses", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          summary: "Reviewers praised novelty but requested control data and citation updates.",
          comments: [
            {
              reviewerId: "Reviewer 1",
              pointNumber: 1,
              comment: "The methodology requires a negative control for assay B.",
              category: "methodology",
              severity: "major",
              suggestedAction: "Run negative control experiments and add to Figure 2.",
              draftResponse: "We thank Reviewer 1 for highlighting this essential control. We have conducted negative control assays and added results to revised Figure 2.",
            },
            {
              reviewerId: "Reviewer 1",
              pointNumber: 2,
              comment: "Figure 3 label formatting is ambiguous.",
              category: "clarity",
              severity: "minor",
              suggestedAction: "Relabel axis and font sizes in Figure 3.",
              draftResponse: "We appreciate this note and have increased font sizes and clarified labels in Figure 3.",
            },
          ],
        },
      });

      const raw = "Reviewer 1:\n1. The methodology requires a negative control for assay B.\n2. Figure 3 label formatting is ambiguous.";
      const res = await reviewService.processReviewComments(raw, { paperTitle: "Quantum Chemistry Study" });

      expect(mockGenerateObject).toHaveBeenCalled();
      expect(res.totalComments).toBe(2);
      expect(res.comments[0].reviewerId).toBe("Reviewer 1");
      expect(res.comments[0].pointNumber).toBe(1);
      expect(res.comments[0].category).toBe("methodology");
      expect(res.comments[0].severity).toBe("major");
      expect(res.comments[0].draftResponse).toContain("We thank Reviewer 1");
      expect(res.comments[1].category).toBe("clarity");
    });

    it("falls back gracefully to heuristic parsing if AI generation throws an error", async () => {
      mockGenerateObject.mockRejectedValueOnce(new Error("OpenAI API key missing or quota exceeded"));

      const raw = `Reviewer 1:
1. The sample size for the statistical analysis appears underpowered.
2. Please clarify the description in Section 2.3.

Reviewer 2:
1. Missing citation to Smith et al. (2023) in the literature review.`;

      const res = await reviewService.processReviewComments(raw);

      expect(res.totalComments).toBe(3);
      expect(res.comments[0].reviewerId).toBe("Reviewer 1");
      expect(res.comments[0].pointNumber).toBe(1);
      expect(res.comments[0].category).toBe("data");
      expect(res.comments[0].draftResponse).toBeDefined();

      expect(res.comments[1].reviewerId).toBe("Reviewer 1");
      expect(res.comments[1].pointNumber).toBe(2);
      expect(res.comments[1].category).toBe("clarity");

      expect(res.comments[2].reviewerId).toBe("Reviewer 2");
      expect(res.comments[2].pointNumber).toBe(1);
      expect(res.comments[2].category).toBe("literature");
    });

    it("fallbackParseReviewComments handles bulleted and unnumbered formats", () => {
      const raw = `- Major concern regarding assay protocol calibration.
- Typo on page 4 line 12.`;

      const res = fallbackParseReviewComments(raw);
      expect(res.totalComments).toBe(2);
      expect(res.comments[0].category).toBe("methodology");
      expect(res.comments[0].severity).toBe("major");
      expect(res.comments[1].category).toBe("grammar");
    });
  });

  describe("POST /api/submissions/[id]/reviews/process Route Handler", () => {
    it("processes JSON body with rawText and returns parsed points and draft responses", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          summary: "1 issue addressed",
          comments: [
            {
              reviewerId: "Reviewer 1",
              pointNumber: 1,
              comment: "Clarify algorithm convergence rate.",
              category: "methodology",
              severity: "minor",
              suggestedAction: "Provide theorem 1 proof sketch.",
              draftResponse: "Thank you. We have provided proof of convergence rate in Appendix B.",
            },
          ],
        },
      });

      const req = new Request("http://localhost/api/submissions/42/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: "Reviewer 1:\n1. Clarify algorithm convergence rate.",
          paperTitle: "Efficient SGD",
        }),
      });

      const params = Promise.resolve({ id: "42" });
      const res = await processReviewsRoute(req, { params });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.submissionId).toBe("42");
      expect(json.totalComments).toBe(1);
      expect(json.comments[0].draftResponse).toContain("Appendix B");
      expect(json.savedToDatabase).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("accepts text/plain body format as well", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          summary: "Plain text input processed",
          comments: [
            {
              reviewerId: "Reviewer 1",
              pointNumber: 1,
              comment: "Check formatting.",
              category: "general",
              severity: "suggestion",
              draftResponse: "Checked.",
            },
          ],
        },
      });

      const req = new Request("http://localhost/api/submissions/42/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "1. Check formatting.",
      });

      const params = Promise.resolve({ id: "42" });
      const res = await processReviewsRoute(req, { params });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.totalComments).toBe(1);
    });

    it("returns 400 if comments text is missing", async () => {
      const req = new Request("http://localhost/api/submissions/42/reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "" }),
      });

      const params = Promise.resolve({ id: "42" });
      const res = await processReviewsRoute(req, { params });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("required");
    });

    it("returns 400 if submission ID is missing", async () => {
      const req = new Request("http://localhost/api/submissions//reviews/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: "Some comment" }),
      });

      const params = Promise.resolve({ id: "" });
      const res = await processReviewsRoute(req, { params });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Submission ID is required");
    });
  });
});
