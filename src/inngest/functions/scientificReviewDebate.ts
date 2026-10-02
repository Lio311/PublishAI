import { inngest } from "../client";
import { submissionReviewStartedEvent } from "../events";
import {
  initializeDebate,
  addDebateMessage,
  runReviewerTurn,
  runAreaChair,
  REVIEWER_PERSONAS,
  AREA_CHAIR_PERSONA,
  type DebatePosition,
} from "../../services/debateService";
import { db } from "@/services/db";
import { debateAgents, debateMessages, debates } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { loadManuscriptText } from "@/services/documents/manuscriptStore";

/** Independent reviews, then one round where reviewers answer each other. */
const ROUNDS = 2;
/** Fewer than two responding reviewers is not a debate. */
const MIN_REVIEWERS = 2;

export const scientificReviewDebate = inngest.createFunction(
  {
    id: "scientific-review-debate",
    triggers: [submissionReviewStartedEvent],
    concurrency: {
      key: "event.data.paperId",
      limit: 1,
    },
    // No idempotency key: the start route allows a retry once a debate has failed;
    // the per-paper concurrency limit above prevents parallel runs.
    retries: 2,
    onFailure: async ({ event, step }) => {
      const paperId =
        event.data.event?.data?.paperId;
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

    // 1. Load the manuscript the reviewers will debate (its full text, not just the title)
    const paperContext = await step.run("fetch-paper-content", async () => {
      const text = await loadManuscriptText(paperId);
      if (!text) throw new NonRetriableError(`No manuscript text available for paper ${paperId}`);
      return text;
    });

    // 2. Initialize debate idempotently. A restarted (previously failed) debate starts
    // from a clean transcript.
    const debateId = await step.run("initialize-debate", async () => {
      const id = await initializeDebate(paperId);
      await db.delete(debateMessages).where(eq(debateMessages.debateId, id));
      await db
        .update(debates)
        .set({ status: "in_progress", consensusSummary: null, completedAt: null })
        .where(eq(debates.id, id));
      return id;
    });

    const agents = await step.run("get-agents", () =>
      db.select().from(debateAgents).where(eq(debateAgents.debateId, debateId))
    );
    const reviewers = agents.filter((a) =>
      (REVIEWER_PERSONAS as readonly string[]).includes(a.persona)
    );
    const areaChair = agents.find((a) => a.persona === AREA_CHAIR_PERSONA);
    if (!areaChair || reviewers.length < MIN_REVIEWERS) {
      throw new NonRetriableError(`Debate ${debateId} is missing its reviewer panel`);
    }

    // 3. Debate rounds: reviewers run in parallel, each on its own model. Round 1 is
    // independent; in later rounds every reviewer answers the others' last positions.
    // A reviewer whose provider fails is left out of that round; nothing is written
    // in its name.
    let positions = new Map<string, DebatePosition>();
    for (let round = 1; round <= ROUNDS; round++) {
      const previous = positions;
      const turns = await Promise.all(
        reviewers
          .filter((agent) => round === 1 || previous.has(agent.id))
          .map((agent) =>
            step.run(`round-${round}-${agent.persona}`, async () => {
              try {
                const content = await runReviewerTurn({
                  agent,
                  round,
                  manuscript: paperContext,
                  otherPositions: [...previous.entries()]
                    .filter(([id]) => id !== agent.id)
                    .map(([, position]) => position),
                });
                await addDebateMessage(debateId, agent.id, content, round);
                return { agentId: agent.id, name: agent.name, content };
              } catch (error) {
                console.error(`[debate] ${agent.name} failed in round ${round}:`, error);
                return { agentId: agent.id, name: agent.name, content: null };
              }
            })
          )
      );

      const next = new Map<string, DebatePosition>();
      for (const turn of turns) {
        if (turn.content) next.set(turn.agentId, { name: turn.name, content: turn.content });
      }
      if (next.size < MIN_REVIEWERS) {
        throw new NonRetriableError(
          `Only ${next.size} reviewer(s) responded in round ${round}; a debate needs at least ${MIN_REVIEWERS}`
        );
      }
      positions = next;
    }

    // 4. The area chair synthesizes the final positions into the consensus decision.
    const summary = await step.run("area-chair-synthesis", async () => {
      const decision = await runAreaChair({
        agent: areaChair,
        manuscript: paperContext,
        positions: [...positions.values()],
      });
      await addDebateMessage(debateId, areaChair.id, decision, ROUNDS + 1, true);
      return decision;
    });

    await step.run("finalize-debate", async () => {
      await db
        .update(debates)
        .set({ status: "consensus_reached", consensusSummary: summary, completedAt: new Date() })
        .where(eq(debates.id, debateId));
    });

    return { success: true, debateId, reviewers: positions.size };
  }
);

