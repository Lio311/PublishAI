import { inngest } from "@/inngest/client";
import { cron } from "inngest";
import { exportDatasetForFineTuning } from "@/services/rlhfService";

export const generateWeeklyFineTuningDataset = inngest.createFunction(
  {
    id: "generate-weekly-finetuning-dataset",
    triggers: [cron("0 0 * * 0")], // Every Sunday at midnight
    concurrency: {
      limit: 1,
    },
  },
  async ({ step }) => {
    const filePath = await step.run("export-dataset", async () => {
      try {
        return await exportDatasetForFineTuning(undefined, "accepted");
      } catch (error) {
        console.error("Failed to export dataset for fine-tuning:", error);
        throw error;
      }
    });

    return { success: true, filePath };
  }
);
