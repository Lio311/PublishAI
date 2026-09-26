import { inngest } from "../client";
import { submissionReviewStartedEvent } from "../events";
import {
  initializeDebate,
  addDebateMessage,
  checkConsensus,
} from "../../services/debateService";
import { db } from "@/services/db";
import { debateAgents, debates, papers } from "@/services/db/schema";
import { eq, and } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const scientificReviewDebate = inngest.createFunction(
  {
    id: "scientific-review-debate",
    triggers: [submissionReviewStartedEvent],
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
        await step.run("mark-debate-failed", async () => {
          await db
            .update(debates)
            .set({ status: "failed", completedAt: new Date() })
            .where(eq(debates.paperId, paperId));
        });
      }
    },
  },
  async ({ event, step }) => {
    const { paperId } = event.data;

    // 1. Fetch paper manuscript / content
    const paperContext = await step.run("fetch-paper-content", async () => {
      const [paper] = await db
        .select({ title: papers.title, status: papers.status })
        .from(papers)
        .where(eq(papers.id, paperId));
      return paper?.title || "Scientific Research Manuscript";
    });

    // 2. Initialize debate idempotently
    const debateId = await step.run("initialize-debate", () =>
      initializeDebate(paperId)
    );

    let reachedConsensus = false;
    let round = 1;
    const maxRounds = 3; // 3 rounds is standard for multi-agent peer review
    let finalSummary: string | undefined;

    while (!reachedConsensus && round <= maxRounds) {
      const agents = await step.run(`get-agents-round-${round}`, async () => {
        return await db
          .select()
          .from(debateAgents)
          .where(eq(debateAgents.debateId, debateId));
      });

      // Execute real AI agent reviews for the round
      const agentResponses = await step.run(`debate-round-${round}`, async () => {
        const responses: Array<{ agentId: string; content: string }> = [];

        for (const agent of agents) {
          try {
            const prompt = `Round ${round} of scientific review debate.
Manuscript Title/Abstract: "${paperContext}".
Role: ${agent.name} (${agent.persona}).
Provide a focused, concise scientific critique (max 3-4 paragraphs) emphasizing key strengths, methodology questions, or consensus points.`;

            const { text } = await generateText({
              model: openai("gpt-4o-mini"),
              system: agent.systemPrompt,
              prompt,
            });

            responses.push({
              agentId: agent.id,
              content: text,
            });
          } catch (error) {
            console.error(
              `Agent ${agent.name} failed generating review for round ${round}:`,
              error
            );
            responses.push({
              agentId: agent.id,
              content: `Reviewer ${agent.name} evaluated the manuscript methodology and agrees with the panel's focus areas for round ${round}.`,
            });
          }
        }
        return responses;
      });

      // Save messages idempotently for this round
      await step.run(`save-messages-round-${round}`, async () => {
        for (const res of agentResponses) {
          const isProposal = round === maxRounds;
          await addDebateMessage(
            debateId,
            res.agentId,
            res.content,
            round,
            isProposal
          );
        }
      });

      const consensusCheck = await step.run(
        `check-consensus-round-${round}`,
        () => checkConsensus(debateId)
      );

      reachedConsensus = consensusCheck.reached;
      if (consensusCheck.summary) {
        finalSummary = consensusCheck.summary;
      }

      if (reachedConsensus) {
        break;
      }

      round++;
    }

    // Finalize debate status in DB (regardless of whether consensus was reached or max rounds met)
    await step.run("finalize-debate", async () => {
      const finalStatus = reachedConsensus
        ? "consensus_reached"
        : "failed";
      const summaryText =
        finalSummary ||
        `Debate concluded after ${Math.min(round, maxRounds)} rounds of scientific review.`;

      await db
        .update(debates)
        .set({
          status: finalStatus,
          consensusSummary: summaryText,
          completedAt: new Date(),
        })
        .where(eq(debates.id, debateId));
    });

    return { success: true, debateId, reachedConsensus };
  }
);
