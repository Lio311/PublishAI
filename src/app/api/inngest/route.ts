import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processPaper, sendWeeklyDigest, processPaperRejected, processResubmission } from "../../../inngest/functions";
import { processSubmission } from "../../../inngest/functions/submission";
import { ingestDocument } from "../../../inngest/functions/ingestDocument";
import { syncCitations } from "../../../inngest/functions/citations";
import { extractPaperGraphData } from "../../../inngest/functions/extractPaperGraphData";
import { generateWeeklyFineTuningDataset } from "../../../inngest/functions/generateWeeklyDataset";
import { processPaperAnalysis } from "../../../inngest/functions/processPaperAnalysis";
import { processPaperFigures } from "../../../inngest/functions/processPaperFigures";
import { processSubmissionOutcome } from "../../../inngest/functions/processSubmissionOutcome";
import { runPreflightCheck } from "../../../inngest/functions/run-preflight";
import { scientificReviewDebate } from "../../../inngest/functions/scientificReviewDebate";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPaper,
    sendWeeklyDigest,
    processSubmission,
    processPaperRejected,
    processResubmission,
    ingestDocument,
    syncCitations,
    extractPaperGraphData,
    generateWeeklyFineTuningDataset,
    processPaperAnalysis,
    processPaperFigures,
    processSubmissionOutcome,
    runPreflightCheck,
    scientificReviewDebate,
  ],
});
