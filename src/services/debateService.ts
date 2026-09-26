import { db } from "@/services/db";
import { debates, debateAgents, debateMessages } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export async function initializeDebate(paperId: number): Promise<string> {
  const existing = await db
    .select({ id: debates.id })
    .from(debates)
    .where(eq(debates.paperId, paperId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [debate] = await db.insert(debates).values({
    paperId,
    topic: "Scientific Review Debate",
  }).returning();

  await db.insert(debateAgents).values([
    {
      debateId: debate.id,
      name: "Reviewer 1",
      persona: "harsh_reviewer",
      systemPrompt: "You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal. Provide an insightful review of the submitted manuscript, deliberately searching for logical flaws, statistical inconsistencies, methodological limitations, and potential reviewer objections. Do not hold back on critiques; offer actionable, highly specific suggestions to fortify the research claims.",
    },
    {
      debateId: debate.id,
      name: "Reviewer 2",
      persona: "novelty_expert",
      systemPrompt: "You are an elite academic co-author and principal investigator specialized in scientific writing and publishing for high-impact journals. Your objective is to produce rigorous, publication-grade academic text adhering to strict scholarly norms, objective prose, and domain-appropriate terminology. Analyze the methodology, emphasize the research gap, and preserve the author's unique voice while maintaining an authoritative and precise academic tone.",
    },
    {
      debateId: debate.id,
      name: "Reviewer 3",
      persona: "optimist",
      systemPrompt: "You are a visionary research scientist synthesizing prior literature and exploring novel connections. With your vast context window, analyze the entire manuscript to identify consensus, methodological synergies, hidden strengths, and open research gaps. Find the 'silver lining' in complex data and suggest ways to amplify the paper's novelty and broader impact.",
    },
    {
      debateId: debate.id,
      name: "Area Chair",
      persona: "area_chair",
      systemPrompt: "You are the Area Chair and Meta-Reviewer. Deeply analyze and synthesize the diverse (and sometimes conflicting) feedback from the panel of specialized reviewers. Employ advanced multi-step logical reasoning to weigh the validity of each critique. Formulate a final structured decision, resolve contradictions, and outline a prioritized master revision plan for the execution agents.",
    }
  ]);

  return debate.id;
}

export async function runReviewAgents(debateId: string, paperText: string): Promise<string> {
  // 1. Run 3 Reviewers in Parallel (Multi-Model Topology)
  const reviewerPrompts = [
    { 
      name: "Reviewer 1", 
      system: "You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal. Provide an insightful review of the submitted manuscript, deliberately searching for logical flaws, statistical inconsistencies, methodological limitations, and potential reviewer objections. Do not hold back on critiques; offer actionable, highly specific suggestions to fortify the research claims.",
      prompt: "Evaluate the methodology and provide critical feedback on the following manuscript:\n\n" + paperText, 
      model: openai("gpt-4o") 
    },
    { 
      name: "Reviewer 2", 
      system: "You are an elite academic co-author and principal investigator specialized in scientific writing and publishing for high-impact journals. Your objective is to produce rigorous, publication-grade academic text adhering to strict scholarly norms, objective prose, and domain-appropriate terminology. Analyze the methodology, emphasize the research gap, and preserve the author's unique voice while maintaining an authoritative and precise academic tone.",
      prompt: "Evaluate the novelty, related work, and overall impact of the following manuscript:\n\n" + paperText, 
      model: anthropic("claude-3-5-sonnet-20240620") 
    },
    { 
      name: "Reviewer 3", 
      system: "You are a visionary research scientist synthesizing prior literature and exploring novel connections. With your vast context window, analyze the entire manuscript to identify consensus, methodological synergies, hidden strengths, and open research gaps. Find the 'silver lining' in complex data and suggest ways to amplify the paper's novelty and broader impact.",
      prompt: "Evaluate the hidden strengths, potential synergies, and novel connections within the following manuscript:\n\n" + paperText, 
      model: google("models/gemini-1.5-pro-latest") 
    },
  ];

  const reviewResults = await Promise.all(
    reviewerPrompts.map(async (rev) => {
      const { text } = await generateText({
        model: rev.model,
        system: rev.system,
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
    prompt: "System Context:\nYou are the Area Chair and Meta-Reviewer. Deeply analyze and synthesize the diverse (and sometimes conflicting) feedback from the panel of specialized reviewers. Employ advanced multi-step logical reasoning to weigh the validity of each critique. Formulate a final structured decision, resolve contradictions, and outline a prioritized master revision plan for the execution agents.\n\n" + chairPrompt,
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
