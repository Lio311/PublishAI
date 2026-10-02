import { inngest } from "@/inngest/client";
import { cron } from "inngest";
import { storeFineTuningDataset } from "@/services/rlhfService";

export const generateWeeklyFineTuningDataset = inngest.createFunction(
  {
    id: "generate-weekly-finetuning-dataset",
    triggers: [cron("0 0 * * 0")], // Every Sunday at midnight
    concurrency: {
      limit: 1,
    },
  },
  async ({ step }) => {
    const dataset = await step.run("export-dataset", () => storeFineTuningDataset("accepted"));
    return { success: true, ...dataset };
  }
);
