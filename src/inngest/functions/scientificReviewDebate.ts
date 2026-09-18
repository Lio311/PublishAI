import { inngest } from "../client";
import { initializeDebate, addDebateMessage, checkConsensus } from "../../services/debateService";
import { db } from "@/services/db";
import { debateAgents, debates } from "@/services/db/schema";
import { eq } from "drizzle-orm";

export const scientificReviewDebate = inngest.createFunction(
  { id: "scientific-review-debate", event: "submission.review.started" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { paperId } = event.data;

    const debateId = await step.run("initialize-debate", () => initializeDebate(paperId));
    
    let reachedConsensus = false;
    let round = 1;
    const maxRounds = 5;

    while (!reachedConsensus && round <= maxRounds) {
      const agents = await step.run(`get-agents-round-${round}`, async () => {
        return db.select().from(debateAgents).where(eq(debateAgents.debateId, debateId));
      });

      const agentResponses = await step.run(`debate-round-${round}`, async () => {
        const responses = [];
        for (const agent of agents) {
          responses.push({
            agentId: agent.id,
            content: `Agent ${agent.name} notes some points for round ${round}.`,
          });
        }
        return responses;
      });

      await step.run(`save-messages-round-${round}`, async () => {
        for (const res of agentResponses) {
          await addDebateMessage(debateId, res.agentId, res.content, round, round === maxRounds);
        }
      });

      const consensusCheck = await step.run(`check-consensus-round-${round}`, () => checkConsensus(debateId));
      reachedConsensus = consensusCheck.reached;
      
      if (reachedConsensus) {
         await step.run("finalize-debate", async () => {
            await db.update(debates).set({ 
              status: "consensus_reached", 
              consensusSummary: consensusCheck.summary,
              completedAt: new Date()
            }).where(eq(debates.id, debateId));
         });
      }

      round++;
    }
    
    return { success: true, debateId };
  }
);
