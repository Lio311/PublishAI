import { inngest } from "../client";
import { paperRejectedEvent } from "../events";
import { db } from "@/services/db";
import { papers, journals, journalConnections } from "@/services/db/schema";
import { eq, and } from "drizzle-orm";
import { journalCascadeMap } from "@/services/journal-cascade";
import { runSubmissionWorkflow } from "@/services/rpa/submission-bot";
import { decrypt } from "@/services/security/encryption";

export const processPaperRejected = inngest.createFunction(
  {
    id: "process-paper-rejected",
    triggers: [paperRejectedEvent],
    concurrency: {
      key: "event.data.paperId",
      limit: 1,
    },
    idempotency: "event.data.paperId",
    retries: 2,
    onFailure: async ({ event, step }) => {
      const paperId =
        (event.data as any)?.event?.data?.paperId ??
        (event.data as any)?.paperId;
      if (paperId) {
        await step.run("mark-cascade-failed", async () => {
          await db
            .update(papers)
            .set({ status: "failed" })
            .where(eq(papers.id, paperId));
        });
      }
    },
  },
  async ({ event, step }) => {
    const { paperId, currentJournalName } = event.data;

    const nextJournalName = journalCascadeMap[currentJournalName];
    if (!nextJournalName) {
      return { success: false, reason: `No cascade target found for ${currentJournalName}` };
    }

    const nextJournalId = await step.run("get-next-journal-id", async () => {
      const [journal] = await db
        .select()
        .from(journals)
        .where(eq(journals.name, nextJournalName));
      return journal?.id || null;
    });

    if (!nextJournalId) {
      return { success: false, reason: `Target journal '${nextJournalName}' not found in DB.` };
    }

    // Update the paper's target journal idempotently
    await step.run("update-target-journal", async () => {
      await db
        .update(papers)
        .set({ targetJournalId: nextJournalId })
        .where(eq(papers.id, paperId));
    });

    // Trigger reformatting step
    await step.run("reformat-paper", async () => {
      console.log(`Reformatting paper ${paperId} for journal ${nextJournalId} (${nextJournalName})`);
    });

    const connectionDetails = await step.run("get-connection-details", async () => {
      const [paper] = await db
        .select()
        .from(papers)
        .where(eq(papers.id, paperId));
      if (!paper || !paper.userId) return null;

      const [connection] = await db
        .select()
        .from(journalConnections)
        .where(
          and(
            eq(journalConnections.userId, paper.userId),
            eq(journalConnections.journalId, nextJournalId)
          )
        );

      if (!connection) return null;
      return {
        siteUrl: connection.siteUrl,
        username: decrypt(connection.encryptedUsername),
        password: decrypt(connection.encryptedPassword),
      };
    });

    if (!connectionDetails) {
      console.warn(`[Cascade] No connected journal credentials found for target journal ${nextJournalId}. Paper updated to awaiting_approval.`);
      await step.run("mark-awaiting-connection", async () => {
        await db
          .update(papers)
          .set({ status: "awaiting_approval" })
          .where(eq(papers.id, paperId));
      });
      return {
        success: false,
        nextJournalId,
        reason: "No journal credentials configured for target journal",
      };
    }

    // Call RPA bot with error handling
    const result = await step.run("run-rpa-submission", async () => {
      const res = await runSubmissionWorkflow(paperId.toString(), connectionDetails);
      if (res && res.status === "error") {
        throw new Error(`RPA cascade submission failed: ${res.message || "Unknown error"}`);
      }
      return res;
    });

    return { success: true, nextJournalId, result };
  }
);
