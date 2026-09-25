import { inngest } from "../client";
import { db } from "@/services/db";
import { papers, journals, journalConnections } from "@/services/db/schema";
import { eq, and } from "drizzle-orm";
import { journalCascadeMap } from "@/services/journal-cascade";
import { runSubmissionWorkflow } from "@/services/rpa/submission-bot";
import { decrypt } from "@/services/security/encryption";

export const processPaperRejected = inngest.createFunction(
  { id: "process-paper-rejected", event: "paper/rejected" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { paperId, currentJournalName } = event.data;

    const nextJournalName = journalCascadeMap[currentJournalName];
    if (!nextJournalName) {
      return { success: false, reason: "No cascade target found." };
    }

    const nextJournalId = await step.run("get-next-journal-id", async () => {
      const [journal] = await db.select().from(journals).where(eq(journals.name, nextJournalName));
      return journal?.id || null;
    });

    if (!nextJournalId) {
      return { success: false, reason: "Target journal not found in DB." };
    }

    // Update the paper's target journal
    await step.run("update-target-journal", async () => {
      await db.update(papers)
        .set({ targetJournalId: nextJournalId })
        .where(eq(papers.id, paperId));
    });

    // Trigger reformatting step
    await step.run("reformat-paper", async () => {
      console.log(`Reformatting paper ${paperId} for journal ${nextJournalId}`);
    });

    const connectionDetails = await step.run("get-connection-details", async () => {
      const [paper] = await db.select().from(papers).where(eq(papers.id, paperId));
      if (!paper || !paper.userId) return null;
      
      const [connection] = await db.select().from(journalConnections).where(
        and(
          eq(journalConnections.userId, paper.userId),
          eq(journalConnections.journalId, nextJournalId)
        )
      );
      
      if (!connection) return null;
      return {
        siteUrl: connection.siteUrl,
        username: decrypt(connection.encryptedUsername),
        password: decrypt(connection.encryptedPassword)
      };
    });

    // Call RPA bot
    const result = await step.run("run-rpa-submission", async () => {
      return await runSubmissionWorkflow(paperId.toString(), connectionDetails || undefined);
    });

    return { success: true, nextJournalId, result };
  }
);
