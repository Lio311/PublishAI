import { inngest } from "./client";
import { db } from "@/db";
import { papers, paperStages } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export const processPaper = inngest.createFunction(
  { id: "process-paper" },
  { event: "paper/uploaded" },
  async ({ event, step }) => {
    const { paperId, textContent } = event.data;

    // Step 1: Update status to in_progress
    await step.run("update-status-in-progress", async () => {
      await db
        .update(papers)
        .set({ status: "in_progress" })
        .where(eq(papers.id, paperId));
    });

    // Step 2: Agent 1 - Clarification & Rules Extraction
    const clarificationOutput = await step.run("agent-clarification", async () => {
      const prompt = `You are an expert academic editor.
      Analyze the following academic text and extract:
      1. The main thesis / objective
      2. The primary field of study
      3. Any obvious missing sections (e.g., no Conclusion)
      
      Here is the text:
      ${textContent.substring(0, 10000)} // Truncating for now to save tokens
      `;

      const msg = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      // We extract text content safely assuming Claude's response format
      const responseText = msg.content.find((c) => c.type === "text")?.text || "";
      
      // Save to database
      await db.insert(paperStages).values({
        paperId,
        stage: "clarification",
        status: "completed",
        agentOutput: responseText,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      return responseText;
    });

    // We can add more agents here (Planning, Knowledge, Scientific Review, etc.)
    // For now, this concludes Phase 2 MVP orchestrator

    return { success: true, clarificationOutput };
  }
);
