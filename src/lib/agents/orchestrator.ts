import { BaseAgent, AgentContext, AgentResult } from "./base-agent";
import { db } from "@/db";
import { paperStages } from "@/db/schema";
import { eq } from "drizzle-orm";

export class AgentOrchestrator {
  constructor(private step: any) {}

  async runStage(
    agent: BaseAgent,
    context: AgentContext
  ): Promise<AgentResult> {
    return await this.step.run(`agent-${agent.stage}`, async () => {
      // 1. Insert stage record
      const [stageRecord] = await db.insert(paperStages).values({
        paperId: Number(context.paperId),
        stage: agent.stage,
        status: "in_progress",
        startedAt: new Date(),
      }).returning();

      try {
        // 2. Execute the agent logic
        const result = await agent.execute(context);
        
        // 3. Update db with results
        await db.update(paperStages).set({
          status: result.status,
          agentOutput: result.output,
          completedAt: new Date(),
        }).where(eq(paperStages.id, stageRecord.id));

        return result;
      } catch (error: any) {
        // Mark as failed in DB
        await db.update(paperStages).set({
          status: "failed",
          userFeedback: error.message || "Unknown error",
          completedAt: new Date(),
        }).where(eq(paperStages.id, stageRecord.id));
        
        throw error;
      }
    });
  }
}
