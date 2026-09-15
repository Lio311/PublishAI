/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
    // 1. Insert stage record in its own step to ensure idempotency
    const stageRecordId = await this.step.run(`init-stage-${agent.stage}`, async () => {
      const [stageRecord] = await db.insert(paperStages).values({
        paperId: Number(context.paperId),
        stage: agent.stage,
        status: "in_progress",
        startedAt: new Date(),
      }).returning();
      return stageRecord.id;
    });

    return await this.step.run(`agent-${agent.stage}`, async () => {
      try {
        // 2. Execute the agent logic
        const result = await agent.execute(context);
        
        // 3. Update db with results
        await db.update(paperStages).set({
          status: result.status,
          agentOutput: result.output,
          completedAt: new Date(),
        }).where(eq(paperStages.id, stageRecordId));

        return result;
      } catch (error: any) {
        // Mark as failed in DB
        await db.update(paperStages).set({
          status: "failed",
          userFeedback: error.message || "Unknown error",
          completedAt: new Date(),
        }).where(eq(paperStages.id, stageRecordId));
        
        throw error;
      }
    });
  }
}
