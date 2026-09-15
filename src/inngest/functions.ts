import { inngest } from "./client";
import { db } from "@/db";
import { papers, users, paperVersions, paperStages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AgentOrchestrator } from "@/lib/agents/orchestrator";
import { ClarificationAgent } from "@/lib/agents/clarification-agent";
import { PlanningAgent } from "@/lib/agents/planning-agent";
import { KnowledgeAgent } from "@/lib/agents/knowledge-agent";
import { ScientificReviewAgent } from "@/lib/agents/scientific-review-agent";
import { AcademicWritingAgent } from "@/lib/agents/academic-writing-agent";
import { ExecutionAgent } from "@/lib/agents/execution-agent";
import { QaAgent } from "@/lib/agents/qa-agent";
import { VerificationAgent } from "@/lib/agents/verification-agent";
import { CoverLetterAgent } from "@/lib/agents/cover-letter-agent";
import { CompilationAgent } from "@/lib/agents/compilation-agent";
import { RebuttalAgent } from "@/lib/agents/rebuttal-agent";
import { AgentContext, AgentResult, Stage } from "@/lib/agents/base-agent";

export const processPaper = inngest.createFunction(
  { 
    id: "process-paper", 
    event: "paper/uploaded",
    onFailure: async ({ event, step }: { event: any, step: any }) => {
      const paperId = event.data.event.data.paperId;
      if (paperId) {
        await step.run("mark-failed", async () => {
          await db.update(papers).set({ status: "failed" }).where(eq(papers.id, paperId));
        });
      }
    }
  } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { paperId, textContent } = event.data;
    
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

    // 1. Clarification
    const clarification = await orchestrator.runStage(new ClarificationAgent(), context);
    context.previousStageOutputs.set("clarification", clarification);

    // 2. Planning
    const planning = await orchestrator.runStage(new PlanningAgent(), context);
    context.previousStageOutputs.set("planning", planning);

    // 3. Knowledge
    const knowledge = await orchestrator.runStage(new KnowledgeAgent(), context);
    context.previousStageOutputs.set("knowledge", knowledge);

    // 4. Scientific Review
    const review = await orchestrator.runStage(new ScientificReviewAgent(), context);
    context.previousStageOutputs.set("scientific_review", review);

    // 5. Academic Writing
    const writing = await orchestrator.runStage(new AcademicWritingAgent(), context);
    context.previousStageOutputs.set("writing", writing);
    context.manuscriptText = writing.output;

    // 6. Execution
    const execution = await orchestrator.runStage(new ExecutionAgent(), context);
    context.previousStageOutputs.set("execution", execution);
    if (execution.metadata?.updatedText) {
      context.manuscriptText = execution.metadata.updatedText as string;
    }

    // 6.5 Integrity Scan
    await step.run("integrity-scan", async () => {
      const { IntegrityScanner } = await import("@/lib/security/integrity-scanner");
      const report = await IntegrityScanner.scanManuscript(context.manuscriptText);
      console.log(`[Integrity] Passed: ${report.passed}. Plagiarism: ${report.plagiarismScore}%. AI: ${report.aiGeneratedScore}%.`);
      if (!report.passed) {
        throw new Error(`Integrity check failed: Plagiarism ${report.plagiarismScore}%, AI ${report.aiGeneratedScore}%`);
      }
    });

    // 7. QA
    const qa = await orchestrator.runStage(new QaAgent(), context);
    context.previousStageOutputs.set("qa", qa);

    // 8. Verification
    const verification = await orchestrator.runStage(new VerificationAgent(), context);
    context.previousStageOutputs.set("verification", verification);

    // 8.5 Cover Letter (Compilation stage variant)
    await orchestrator.runStage(new CoverLetterAgent(), context);

    // 9. Compilation
    const compilation = await orchestrator.runStage(new CompilationAgent(), context);
    context.previousStageOutputs.set("compilation", compilation);

    // Finalize
    await step.run("mark-awaiting-approval", async () => {
      await db
        .update(papers)
        .set({ status: "awaiting_approval" })
        .where(eq(papers.id, paperId));

      const paperResult = await db.select({
        title: papers.title,
        userEmail: users.email
      }).from(papers)
        .leftJoin(users, eq(papers.userId, users.id))
        .where(eq(papers.id, paperId));

      if (paperResult.length > 0 && paperResult[0].userEmail) {
        const { title, userEmail } = paperResult[0];
        try {
          const { sendAwaitingApprovalEmail } = await import("@/lib/email/notification-service");
          await sendAwaitingApprovalEmail(userEmail, title, paperId.toString());
        } catch (e) {
          console.error("Failed to send email notification", e);
        }
      }
    });

    return { success: true, stagesCompleted: 9 };
  }
);

export const sendWeeklyDigest = inngest.createFunction(
  { id: "send-weekly-digest", cron: "0 9 * * 1" } as any, // Every Monday at 9:00 AM
  async ({ step }: { step: any }) => {
    await step.run("send-emails", async () => {
      console.log("Sending weekly digest to users with weeklyDigest enabled...");
      return { sent: true };
    });
  }
);


export const processResubmission = inngest.createFunction(
  { 
    id: "process-resubmission", 
    event: "paper/reviewer-comments-received",
    onFailure: async ({ event, step }: { event: any, step: any }) => {
      const paperId = event.data.event.data.paperId;
      if (paperId) {
        await step.run("mark-failed", async () => {
          await db.update(papers).set({ status: "failed" }).where(eq(papers.id, paperId));
        });
      }
    }
  } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { paperId, reviewerComments, versionId } = event.data;
    
    const orchestrator = new AgentOrchestrator(step);
    
    await step.run("update-status-resubmission", async () => {
      await db
        .update(papers)
        .set({ status: "in_progress" })
        .where(eq(papers.id, paperId));
        
      if (versionId) {
        await db.update(paperVersions)
          .set({ reviewerComments })
          .where(eq(paperVersions.id, versionId));
      }
    });

    const manuscriptText = await step.run("fetch-paper-text", async () => {
       const stages = await db.select().from(paperStages).where(eq(paperStages.paperId, paperId));
       const sorted = stages.sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
       const latestText = sorted.find(s => s.agentOutput)?.agentOutput;
       if (latestText) return latestText;

       const [rec] = await db.select().from(papers).where(eq(papers.id, paperId));
       return rec?.title || "Latest Manuscript Text Here";
    });

    // In reality, we'd fetch the latest version text.
    // For this MVP, we pass the reviewer comments to the context.
    const context: AgentContext = {
      paperId: paperId.toString(),
      manuscriptText: manuscriptText,
      reviewerComments,
      previousStageOutputs: new Map<Stage, AgentResult>(),
    };

    // Run the Rebuttal Agent to generate a strategy
    const rebuttal = await orchestrator.runStage(new RebuttalAgent(), context);
    
    // Save strategy to DB
    await step.run("save-rebuttal-strategy", async () => {
      if (versionId) {
        await db.update(paperVersions)
          .set({ rebuttalStrategy: rebuttal.output })
          .where(eq(paperVersions.id, versionId));
      }
    });

    // Here we would run Knowledge, Execution, and QA again as described in characterization
    // For MVP phase 5 step 1, we just await user approval of the strategy.
    
    await step.run("mark-awaiting-strategy-approval", async () => {
      await db
        .update(papers)
        .set({ status: "awaiting_approval" })
        .where(eq(papers.id, paperId));
    });

    return { success: true, rebuttalGenerated: true };
  }
);
