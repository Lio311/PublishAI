jest.mock("@e2b/code-interpreter", () => ({
  Sandbox: {
    create: jest.fn().mockResolvedValue({
      commands: { run: jest.fn() },
      files: { write: jest.fn() },
      runCode: jest.fn().mockResolvedValue({ logs: { stdout: [], stderr: [] } }),
      kill: jest.fn(),
    }),
  },
}));

jest.mock("@/services/e2bService", () => ({
  runPythonInSandbox: jest.fn().mockResolvedValue({ logs: "", results: [], chartUrls: [] }),
}));

jest.mock("@/services/dataAnalysisService", () => ({
  generateAnalysisScript: jest.fn().mockResolvedValue("print('analyzed')"),
}));

jest.mock("@/services/rpa/submission-bot", () => ({
  runSubmissionWorkflow: jest.fn().mockResolvedValue({ status: "success", trackingId: "test-123" }),
}));

import {
  paperUploadedEvent,
  paperReviewerCommentsReceivedEvent,
  paperRejectedEvent,
  paperPreflightEvent,
  submissionProcessEvent,
  submissionStatusUpdatedEvent,
  submissionReviewStartedEvent,
  submissionCaptchaSolvedEvent,
  datasetUploadedEvent,
  documentUploadedEvent,
  qaFiguresAnalyzedEvent,
  paperUploadedSchema,
  submissionProcessSchema,
  paperPreflightSchema,
} from "@/inngest/events";
import { processPaper, processResubmission, sendWeeklyDigest } from "@/inngest/functions";
import { processSubmission } from "@/inngest/functions/submission";
import { processPaperRejected } from "@/inngest/functions/cascade";
import { ingestDocument } from "@/inngest/functions/ingestDocument";
import { syncCitations } from "@/inngest/functions/citations";
import { extractPaperGraphData } from "@/inngest/functions/extractPaperGraphData";
import { generateWeeklyFineTuningDataset } from "@/inngest/functions/generateWeeklyDataset";
import { processPaperAnalysis } from "@/inngest/functions/processPaperAnalysis";
import { processPaperFigures } from "@/inngest/functions/processPaperFigures";
import { processSubmissionOutcome } from "@/inngest/functions/processSubmissionOutcome";
import { runPreflightCheck } from "@/inngest/functions/run-preflight";
import { scientificReviewDebate } from "@/inngest/functions/scientificReviewDebate";

describe("Inngest Event Schemas & Functions Audit", () => {
  describe("Event Schemas Validation", () => {
    it("validates valid paper/uploaded event data", () => {
      const valid = { paperId: 101, textContent: "Sample abstract and intro" };
      const parsed = paperUploadedSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.paperId).toBe(101);
      }
    });

    it("rejects invalid paper/uploaded event data without paperId", () => {
      const invalid = { textContent: "No paperId here" };
      const parsed = paperUploadedSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("validates submission/process event data", () => {
      const valid = { submissionId: 42 };
      const parsed = submissionProcessSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("validates paper/preflight event data", () => {
      const valid = {
        code: "import pandas as pd\nprint(1)",
        dependencies: ["pandas", "numpy"],
        datasets: [{ url: "https://example.com/data.csv", filename: "data.csv" }],
      };
      const parsed = paperPreflightSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("creates typed event instances using Inngest eventType", () => {
      const event = paperUploadedEvent.create({
        paperId: 55,
        textContent: "Full manuscript",
      });
      expect(event.name).toBe("paper/uploaded");
      expect(event.data.paperId).toBe(55);
    });
  });

  describe("Function Configuration & Concurrency / Rate Limiting", () => {
    it("processPaper has per-paper concurrency and idempotency configured", () => {
      const opts = (processPaper as any).opts;
      expect(opts.id).toBe("process-paper");
      expect(opts.concurrency).toEqual({
        key: "event.data.paperId",
        limit: 1,
      });
      expect(opts.idempotency).toBe("event.data.paperId");
      expect(opts.retries).toBe(2);
    });

    it("processSubmission has per-submission concurrency and idempotency configured", () => {
      const opts = (processSubmission as any).opts;
      expect(opts.id).toBe("process-submission");
      expect(opts.concurrency).toEqual({
        key: "event.data.submissionId",
        limit: 1,
      });
      expect(opts.idempotency).toBe("event.data.submissionId");
      expect(opts.retries).toBe(3);
    });

    it("processPaperAnalysis throttles E2B concurrency", () => {
      const opts = (processPaperAnalysis as any).opts;
      expect(opts.id).toBe("process-paper-analysis");
      expect(opts.concurrency).toEqual({ limit: 5 });
      expect(opts.idempotency).toBe("event.data.paperId");
    });

    it("runPreflightCheck throttles E2B concurrency", () => {
      const opts = (runPreflightCheck as any).opts;
      expect(opts.id).toBe("run-preflight-check");
      expect(opts.concurrency).toEqual({ limit: 5 });
    });

    it("ingestDocument has rate limiting and per-document concurrency", () => {
      const opts = (ingestDocument as any).opts;
      expect(opts.id).toBe("ingest-document");
      expect(opts.concurrency).toEqual({
        key: "event.data.documentId",
        limit: 1,
      });
      expect(opts.rateLimit).toEqual({
        limit: 30,
        period: "1m",
      });
      expect(opts.idempotency).toBe("event.data.documentId");
    });

    it("extractPaperGraphData has rate limiting and per-paper concurrency", () => {
      const opts = (extractPaperGraphData as any).opts;
      expect(opts.id).toBe("extract-paper-graph-data");
      expect(opts.concurrency).toEqual({
        key: "event.data.paperId",
        limit: 1,
      });
      expect(opts.rateLimit).toEqual({
        limit: 20,
        period: "1m",
      });
    });

    it("processPaperFigures has per-paper concurrency configured", () => {
      const opts = (processPaperFigures as any).opts;
      expect(opts.id).toBe("process-paper-figures");
      expect(opts.concurrency).toEqual({
        key: "event.data.paperId",
        limit: 1,
      });
      expect(opts.idempotency).toBe("event.data.paperId");
    });

    it("scientificReviewDebate has per-paper concurrency configured", () => {
      const opts = (scientificReviewDebate as any).opts;
      expect(opts.id).toBe("scientific-review-debate");
      expect(opts.concurrency).toEqual({
        key: "event.data.paperId",
        limit: 1,
      });
    });

    it("syncCitations and sendWeeklyDigest have cron and singleton concurrency", () => {
      const syncOpts = (syncCitations as any).opts;
      expect(syncOpts.id).toBe("sync-citations");
      expect(syncOpts.concurrency).toEqual({ limit: 1 });

      const digestOpts = (sendWeeklyDigest as any).opts;
      expect(digestOpts.id).toBe("send-weekly-digest");
      expect(digestOpts.concurrency).toEqual({ limit: 1 });
    });

    it("processSubmissionOutcome and processPaperRejected are configured with concurrency", () => {
      const outcomeOpts = (processSubmissionOutcome as any).opts;
      expect(outcomeOpts.id).toBe("process-submission-outcome");
      expect(outcomeOpts.concurrency).toEqual({
        key: "event.data.submissionId",
        limit: 1,
      });

      const cascadeOpts = (processPaperRejected as any).opts;
      expect(cascadeOpts.id).toBe("process-paper-rejected");
      expect(cascadeOpts.concurrency).toEqual({
        key: "event.data.paperId",
        limit: 1,
      });
    });
  });
});
