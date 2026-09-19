import { db } from "@/services/db";
import { debates, debateAgents, debateMessages } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export async function initializeDebate(paperId: number): Promise<string> {
  const [debate] = await db.insert(debates).values({
    paperId,
    topic: "Scientific Review Debate",
  }).returning();

  await db.insert(debateAgents).values([
    {
      debateId: debate.id,
      name: "Reviewer 1",
      persona: "harsh_reviewer",
      systemPrompt: "You are Reviewer 1 (Harsh Critic). Focus on methodology flaws.",
    },
    {
      debateId: debate.id,
      name: "Reviewer 2",
      persona: "novelty_expert",
      systemPrompt: "You are Reviewer 2 (Novelty Expert). Focus on impact and related work.",
    },
    {
      debateId: debate.id,
      name: "Reviewer 3",
      persona: "optimist",
      systemPrompt: "You are Reviewer 3 (Optimist). Find strengths and potential.",
    },
    {
      debateId: debate.id,
      name: "Area Chair",
      persona: "area_chair",
      systemPrompt: "You are the Area Chair. Synthesize the reviewers' feedback into a final decision.",
    }
  ]);

  return debate.id;
}

export async function runReviewAgents(debateId: string, paperText: string): Promise<string> {
  // 1. Run 3 Reviewers in Parallel (Multi-Model Topology)
  const reviewerPrompts = [
    { name: "Reviewer 1", prompt: "Evaluate the methodology. Paper: " + paperText, model: openai("gpt-4o") },
    { name: "Reviewer 2", prompt: "Evaluate the novelty. Paper: " + paperText, model: anthropic("claude-3-5-sonnet-20240620") },
    { name: "Reviewer 3", prompt: "Evaluate the strengths. Paper: " + paperText, model: google("models/gemini-1.5-pro-latest") },
  ];

  const reviewResults = await Promise.all(
    reviewerPrompts.map(async (rev) => {
      const { text } = await generateText({
        model: rev.model,
        prompt: rev.prompt,
      });
      return { name: rev.name, feedback: text };
    })
  );

  for (const result of reviewResults) {
    await addDebateMessage(debateId, null, result.feedback, 1, false);
  }

  // 2. Run Area Chair Synthesis (Sequential Meta-Agent)
  const chairPrompt = "As Area Chair, synthesize the following 3 reviews into a final structured decision:\\n\\n" +
    reviewResults.map(r => `${r.name}:\\n${r.feedback}`).join("\\n\\n");

  const { text: areaChairDecision } = await generateText({
    model: openai("o1-preview"),
    prompt: chairPrompt,
  });

  await addDebateMessage(debateId, null, areaChairDecision, 2, true);

  // Update debate status
  await db.update(debates)
    .set({ status: "consensus_reached", consensusSummary: areaChairDecision })
    .where(eq(debates.id, debateId));

  return areaChairDecision;
}

export async function addDebateMessage(
  debateId: string,
  agentId: string | null,
  content: string,
  round: number,
  isConsensusProposal = false
): Promise<string> {
  const [message] = await db.insert(debateMessages).values({
    debateId,
    agentId,
    content,
    round,
    isConsensusProposal,
  }).returning();

  return message.id;
}

export async function checkConsensus(debateId: string): Promise<{ reached: boolean; summary?: string }> {
  const msgs = await db.select().from(debateMessages).where(eq(debateMessages.debateId, debateId));
  const consensusProposals = msgs.filter((m) => m.isConsensusProposal);
  
  if (consensusProposals.length > 0) {
    return { reached: true, summary: consensusProposals[consensusProposals.length - 1].content };
  }
  
  return { reached: false };
}
