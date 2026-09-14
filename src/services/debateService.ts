import { db } from "@/db";
import { debates, debateAgents, debateMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function initializeDebate(submissionId: string): Promise<string> {
  const [debate] = await db.insert(debates).values({
    submissionId,
    topic: "Scientific Review Debate",
  }).returning();

  await db.insert(debateAgents).values([
    {
      debateId: debate.id,
      name: "Methodology Expert",
      persona: "methodology_expert",
      systemPrompt: "You are a methodology expert analyzing the submission.",
    },
    {
      debateId: debate.id,
      name: "Harsh Reviewer",
      persona: "harsh_reviewer",
      systemPrompt: "You are a harsh reviewer looking for flaws.",
    },
  ]);

  return debate.id;
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
    return { reached: true, summary: "Consensus reached based on multiple agreements." };
  }
  
  return { reached: false };
}
