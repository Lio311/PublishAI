import { inngest } from "@/inngest/client";
import { exportDatasetForFineTuning } from "@/services/rlhfService";

export const generateWeeklyFineTuningDataset = inngest.createFunction(
  { id: "generate-weekly-finetuning-dataset", cron: "0 0 * * 0" } as any,
  async ({ step }: { step: any }) => {
    await step.run('export-dataset', async () => {
      await exportDatasetForFineTuning(undefined, 'accepted');
    });
  }
);
