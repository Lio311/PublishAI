import { inngest } from "./client";
import { db } from "@/db";
import { papers, paperStages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { askClaude } from "@/lib/agents/claude-client";

export const processPaper = inngest.createFunction(
  { id: "process-paper", event: "paper/uploaded" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { paperId, textContent } = event.data;

    // Step 0: Mark as in_progress
    await step.run("update-status-in-progress", async () => {
      await db
        .update(papers)
        .set({ status: "in_progress" })
        .where(eq(papers.id, paperId));
    });

    // Step 1: Clarification Agent (Needs Approval)
    const clarification = await step.run("agent-clarification", async () => {
      const prompt = `You are an expert academic editor.
      Analyze the following academic text and extract:
      1. The main thesis / objective
      2. The primary field of study
      3. Any obvious missing sections (e.g., no Conclusion)
      
      Text: ${textContent.substring(0, 10000)}
      `;

      const { text, tokensUsed } = await askClaude(prompt, "claude-3-7-sonnet-20250219");
      
      await db.insert(paperStages).values({
        paperId,
        stage: "clarification",
        status: "awaiting_approval", // Pauses here for user input in real UI
        agentOutput: text,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      return text;
    });

    // We can simulate pausing via Inngest `step.waitForEvent`
    // For MVP, we proceed automatically to demonstrate the full pipeline in logs.
    
    // Step 2: Planning Agent
    const planning = await step.run("agent-planning", async () => {
      const prompt = `Based on the clarification: ${clarification}, 
      create a structural revision plan for this paper.`;
      
      const { text } = await askClaude(prompt, "claude-3-opus-20240229");
      return text;
    });

    // Step 3: Knowledge Agent
    const knowledge = await step.run("agent-knowledge", async () => {
      return "Knowledge gathering complete. (Stub)";
    });

    // Step 4: Scientific Review Agent
    const scientificReview = await step.run("agent-scientific-review", async () => {
      return "Scientific review complete. (Stub)";
    });

    // Step 5: Academic Writing Agent
    const writing = await step.run("agent-writing", async () => {
      return "Writing revision complete. (Stub)";
    });

    // Step 6: Execution Agent
    const execution = await step.run("agent-execution", async () => {
      return "Execution applied to document. (Stub)";
    });

    // Step 7: QA Agent
    const qa = await step.run("agent-qa", async () => {
      return "QA check passed. (Stub)";
    });

    // Step 8: Verification Agent
    const verification = await step.run("agent-verification", async () => {
      return "Verification confirmed. (Stub)";
    });

    // Step 8.5: Cover Letter Agent
    const coverLetter = await step.run("agent-cover-letter", async () => {
      // Typically we would use CoverLetterAgent class, but using raw askClaude for simplicity here
      const prompt = `Write a professional academic cover letter based on this paper intro: ${textContent.substring(0, 1000)}`;
      const { text } = await askClaude(prompt, "claude-3-7-sonnet-20250219");
      return text;
    });

    // Step 9: Compilation Agent
    const compilation = await step.run("agent-compilation", async () => {
      await db
        .update(papers)
        .set({ status: "completed" })
        .where(eq(papers.id, paperId));
        
      return "Final compilation ready. (Stub)";
    });

    return { success: true, stagesCompleted: 9 };
  }
);

export const sendWeeklyDigest = inngest.createFunction(
  { id: "send-weekly-digest" },
  { cron: "0 9 * * 1" }, // Every Monday at 9:00 AM
  async ({ step }) => {
    await step.run("send-emails", async () => {
      // In a real application, we would fetch users with weeklyDigest = true
      // and send them an email via Resend/SendGrid.
      console.log("Sending weekly digest to users with weeklyDigest enabled...");
      // For now, it just simulates the job running.
      return { sent: true };
    });
  }
);
