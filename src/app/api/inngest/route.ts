import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processPaper, sendWeeklyDigest, processPaperRejected } from "../../../inngest/functions";
import { processSubmission } from "../../../inngest/functions/submission";
import { ingestDocument } from "../../../inngest/functions/ingestDocument";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPaper,
    sendWeeklyDigest,
    processSubmission,
    processPaperRejected,
    ingestDocument,
  ],
});
