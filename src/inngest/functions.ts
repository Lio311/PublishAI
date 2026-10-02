import { inngest } from "./client";
import {
  paperUploadedEvent,
  paperReviewerCommentsReceivedEvent,
} from "./events";
import { cron, NonRetriableError } from "inngest";
import { db } from "@/services/db";
import {
  papers,
  users,
  userSettings,
  paperVersions,
  paperStages,
} from "@/services/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { loadManuscriptText, updateManuscriptMetadata } from "@/services/documents/manuscriptStore";
import { AgentOrchestrator } from "@/services/agents/orchestrator";
import { ClarificationAgent } from "@/services/agents/clarification-agent";
import { PlanningAgent } from "@/services/agents/planning-agent";
import { KnowledgeAgent } from "@/services/agents/knowledge-agent";
import { ScientificReviewAgent } from "@/services/agents/scientific-review-agent";
import { AcademicWritingAgent } from "@/services/agents/academic-writing-agent";
import { ExecutionAgent } from "@/services/agents/execution-agent";
import { QaAgent } from "@/services/agents/qa-agent";
import { VerificationAgent } from "@/services/agents/verification-agent";
import { CoverLetterAgent } from "@/services/agents/cover-letter-agent";
import { CompilationAgent } from "@/services/agents/compilation-agent";
import { RebuttalAgent } from "@/services/agents/rebuttal-agent";
import { AgentContext, AgentResult, Stage } from "@/services/agents/base-agent";
import {
  getTransporter,
  getSenderAddress,
  sendWeeklyDigestEmail,
} from "@/services/email/notification-service";

export const processPaper = inngest.createFunction(
  {
    id: "process-paper",
    triggers: [paperUploadedEvent],
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
        await step.run("mark-failed", async () => {
          await db
            .update(papers)
            .set({ status: "failed" })
            .where(eq(papers.id, paperId));
        });
      }
    },
  },
  async ({ event, step }) => {
    const { paperId } = event.data;

    // Events carry ids only; the manuscript text is stored with the paper's document.
    const textContent =
      event.data.textContent ||
      (await step.run("load-manuscript-text", () => loadManuscriptText(paperId)));
    if (!textContent) {
      throw new NonRetriableError(`No manuscript text available for paper ${paperId}`);
    }

    const orchestrator = new AgentOrchestrator(step);

    await step.run("update-status-in-progress", async () => {
      await db
        .update(papers)
        .set({ status: "in_progress" })
        .where(eq(papers.id, paperId));
    });

    const context: AgentContext = {
      paperId: paperId.toString(),
      manuscriptText: textContent,
      previousStageOutputs: new Map<Stage, AgentResult>(),
    };

    // 0. Integrity scan of the author's original text. It must run before the
    // writing agents (which rewrite the text with AI and would trip the AI-text
    // heuristic) and is advisory: an LLM estimate is not grounds to fail a paper.
    await step.run("integrity-scan", async () => {
      try {
        const { IntegrityScanner } = await import("@/services/security/integrity-scanner");
        const report = await IntegrityScanner.scanManuscript(textContent);
        await updateManuscriptMetadata(paperId, { integrityReport: { ...report, scannedAt: new Date().toISOString() } });
        return { passed: report.passed };
      } catch (error) {
        console.warn(`[Integrity] Scan unavailable for paper ${paperId}:`, error);
        return { passed: null };
      }
    });

    // 1. Clarification
    const clarification = await orchestrator.runStage(
      new ClarificationAgent(),
      context
    );
    context.previousStageOutputs.set("clarification", clarification);

    // 2. Planning
    const planning = await orchestrator.runStage(
      new PlanningAgent(),
      context
    );
    context.previousStageOutputs.set("planning", planning);

    // 3. Knowledge
    const knowledge = await orchestrator.runStage(
      new KnowledgeAgent(),
      context
    );
    context.previousStageOutputs.set("knowledge", knowledge);

    // 4. Scientific Review
    const review = await orchestrator.runStage(
      new ScientificReviewAgent(),
      context
    );
    context.previousStageOutputs.set("scientific_review", review);

    // 5. Academic Writing
    const writing = await orchestrator.runStage(
      new AcademicWritingAgent(),
      context
    );
    context.previousStageOutputs.set("writing", writing);
    context.manuscriptText = writing.output;

    // 6. Execution
    const execution = await orchestrator.runStage(
      new ExecutionAgent(),
      context
    );
    context.previousStageOutputs.set("execution", execution);
    if (execution.metadata?.updatedText) {
      context.manuscriptText = execution.metadata.updatedText as string;
    }

    // 7. QA
    const qa = await orchestrator.runStage(new QaAgent(), context);
    context.previousStageOutputs.set("qa", qa);

    // 8. Verification
    const verification = await orchestrator.runStage(
      new VerificationAgent(),
      context
    );
    context.previousStageOutputs.set("verification", verification);

    // 8.5 Cover Letter
    await orchestrator.runStage(new CoverLetterAgent(), context);

    // 9. Compilation
    const compilation = await orchestrator.runStage(
      new CompilationAgent(),
      context
    );
    context.previousStageOutputs.set("compilation", compilation);

    // Finalize
    await step.run("mark-awaiting-approval", async () => {
      await db
        .update(papers)
        .set({ status: "awaiting_approval" })
        .where(eq(papers.id, paperId));

      const paperResult = await db
        .select({
          title: papers.title,
          userEmail: users.email,
        })
        .from(papers)
        .leftJoin(users, eq(papers.userId, users.id))
        .where(eq(papers.id, paperId));

      if (paperResult.length > 0 && paperResult[0].userEmail) {
        const { title, userEmail } = paperResult[0];
        try {
          const { sendAwaitingApprovalEmail } = await import(
            "@/services/email/notification-service"
          );
          await sendAwaitingApprovalEmail(
            userEmail,
            title,
            paperId.toString()
          );
        } catch (e) {
          console.error("Failed to send email notification", e);
        }
      }
    });

    // Hand the finished manuscript to the multi-agent reviewer debate.
    await step.sendEvent("start-review-debate", {
      name: "submission/review-started",
      data: { paperId },
    });

    return { success: true, stagesCompleted: 9 };
  }
);

export const sendWeeklyDigest = inngest.createFunction(
  {
    id: "send-weekly-digest",
    triggers: [cron("0 9 * * 1")], // Every Monday at 9:00 AM
    concurrency: {
      limit: 1,
    },
  },
  async ({ step }) => {
    const recipients = await step.run("fetch-digest-recipients", async () => {
      const eligibleUsers = await db
        .select({
          userId: users.id,
          email: users.email,
          name: users.name,
          weeklyDigest: userSettings.weeklyDigest,
        })
        .from(users)
        .leftJoin(userSettings, eq(users.id, userSettings.userId));

      return eligibleUsers.filter(
        (u) => u.email && (u.weeklyDigest === true || u.weeklyDigest === null)
      );
    });

    let sentCount = 0;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const user of recipients) {
      await step.run(`send-digest-${user.userId}`, async () => {
        try {
          const userPapers = await db
            .select({
              id: papers.id,
              title: papers.title,
              status: papers.status,
              updatedAt: papers.updatedAt,
            })
            .from(papers)
            .where(
              and(
                eq(papers.userId, user.userId),
                gte(papers.updatedAt, oneWeekAgo)
              )
            );

          const totalPapers = await db
            .select({ id: papers.id })
            .from(papers)
            .where(eq(papers.userId, user.userId));

          const highlights: string[] = [];
          const updatedCount = userPapers.length;
          const completedCount = userPapers.filter(
            (p) => p.status === "completed" || p.status === "awaiting_approval"
          ).length;

          if (updatedCount > 0) {
            highlights.push(`${updatedCount} paper(s) updated in the past week`);
          }
          if (completedCount > 0) {
            highlights.push(`${completedCount} paper(s) completed or ready for approval`);
          }
          if (highlights.length === 0) {
            highlights.push("No new paper changes this week. Start a new manuscript anytime!");
          }

          const result = await sendWeeklyDigestEmail(
            user.email!,
            user.name || undefined,
            {
              papersCount: totalPapers.length,
              submissionsCount: completedCount,
              highlights,
              throwOnError: true,
            }
          );

          if (result.success) {
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send weekly digest to ${user.email}:`, error);
        }
      });
    }

    return { sent: true, count: sentCount };
  }
);

export const processResubmission = inngest.createFunction(
  {
    id: "process-resubmission",
    triggers: [paperReviewerCommentsReceivedEvent],
    concurrency: {
      key: "event.data.paperId",
      limit: 1,
    },
    // No idempotency key: a paper can go through several review rounds.
    retries: 2,
    onFailure: async ({ event, step }) => {
      const paperId =
        (event.data as any)?.event?.data?.paperId ??
        (event.data as any)?.paperId;
      if (paperId) {
        await step.run("mark-failed", async () => {
          await db
            .update(papers)
            .set({ status: "failed" })
            .where(eq(papers.id, paperId));
        });
      }
    },
  },
  async ({ event, step }) => {
    const { paperId, reviewerComments, versionId } = event.data;

    const orchestrator = new AgentOrchestrator(step);

    await step.run("update-status-resubmission", async () => {
      await db
        .update(papers)
        .set({ status: "in_progress" })
        .where(eq(papers.id, paperId));

      if (versionId) {
        await db
          .update(paperVersions)
          .set({ reviewerComments })
          .where(eq(paperVersions.id, versionId));
      }
    });

    const manuscriptText = await step.run("fetch-paper-text", async () => {
      // Prefer the latest revised manuscript (compilation > execution > writing output);
      // other stages (QA, cover letter...) produce reports, not the manuscript itself.
      const stages = await db
        .select()
        .from(paperStages)
        .where(eq(paperStages.paperId, paperId));
      const manuscriptStages = ["compilation", "execution", "writing"] as const;
      for (const stageName of manuscriptStages) {
        const latest = stages
          .filter((s) => s.stage === stageName && s.status === "completed" && s.agentOutput)
          .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0];
        if (latest?.agentOutput) return latest.agentOutput;
      }

      const original = await loadManuscriptText(paperId);
      if (!original) throw new NonRetriableError(`No manuscript text available for paper ${paperId}`);
      return original;
    });

    const context: AgentContext = {
      paperId: paperId.toString(),
      manuscriptText: manuscriptText,
      reviewerComments,
      previousStageOutputs: new Map<Stage, AgentResult>(),
    };

    // Run the Rebuttal Agent to generate a strategy
    const rebuttal = await orchestrator.runStage(
      new RebuttalAgent(),
      context
    );

    // Save strategy to DB
    await step.run("save-rebuttal-strategy", async () => {
      if (versionId) {
        await db
          .update(paperVersions)
          .set({ rebuttalStrategy: rebuttal.output })
          .where(eq(paperVersions.id, versionId));
      }
    });

    await step.run("mark-awaiting-strategy-approval", async () => {
      await db
        .update(papers)
        .set({ status: "awaiting_approval" })
        .where(eq(papers.id, paperId));
    });

    return { success: true, rebuttalGenerated: true };
  }
);

export { processPaperRejected } from "./functions/cascade";
export { processIncomingEmailReview } from "./functions/emailReview";
export { processStripeWebhook } from "./functions/stripeWebhook";
