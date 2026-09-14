import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processPaper, sendWeeklyDigest } from "../../../inngest/functions";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPaper,
    sendWeeklyDigest,
  ],
});
