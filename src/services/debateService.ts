import { db } from "@/services/db";
import { debates, debateAgents, debateMessages } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { generateText, type LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { ANTHROPIC_MODELS, GOOGLE_MODELS, OPENAI_MODELS } from "@/services/ai/modelIds";

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

/** Reviewer personas debate; the area chair only synthesizes their final positions. */
export const REVIEWER_PERSONAS = ["harsh_reviewer", "novelty_expert", "optimist"] as const;
export const AREA_CHAIR_PERSONA = "area_chair";

/** Keeps the manuscript well inside every reviewer model's context window. */
const MAX_MANUSCRIPT_CHARS = 150_000;

/**
 * Each reviewer runs on a different provider so the panel does not share one model's
 * blind spots; the area chair uses the strongest reasoning model.
 */
function modelForPersona(persona: string): LanguageModel {
  switch (persona) {
    case "harsh_reviewer":
      return openai(OPENAI_MODELS.standard);
    case "optimist":
      return google(GOOGLE_MODELS.standard);
    case AREA_CHAIR_PERSONA:
      return anthropic(ANTHROPIC_MODELS.reasoning);
    default:
      return anthropic(ANTHROPIC_MODELS.standard);
  }
}

function manuscriptBlock(manuscript: string): string {
  const text =
    manuscript.length > MAX_MANUSCRIPT_CHARS
      ? `${manuscript.slice(0, MAX_MANUSCRIPT_CHARS)}\n\n[Manuscript truncated for length]`
      : manuscript;
  return `<manuscript>\n${text}\n</manuscript>`;
}

export interface DebateAgentInfo {
  name: string;
  persona: string;
  systemPrompt: string;
}

export interface DebatePosition {
  name: string;
  content: string;
}

/**
 * One reviewer's turn. Round 1 is an independent review; later rounds respond to the
 * other reviewers' previous positions, so the panel actually debates.
 */
export async function runReviewerTurn(params: {
  agent: DebateAgentInfo;
  round: number;
  manuscript: string;
  otherPositions: DebatePosition[];
}): Promise<string> {
  const { agent, round, manuscript, otherPositions } = params;
  const task =
    round === 1 || otherPositions.length === 0
      ? `Write your independent review of the manuscript as ${agent.name}. Cover the key strengths, the most important weaknesses, and specific, actionable revisions. Keep it to 3-4 focused paragraphs.`
      : `This is round ${round} of the review debate. Below are the other reviewers' positions from the previous round. Respond to them directly: state where you agree, where you disagree and why, and which revisions you consider essential versus optional. Keep it to 2-3 focused paragraphs.\n\n` +
        otherPositions.map((p) => `<review reviewer="${p.name}">\n${p.content}\n</review>`).join("\n\n");

  const { text } = await generateText({
    model: modelForPersona(agent.persona),
    system: agent.systemPrompt,
    prompt: `${manuscriptBlock(manuscript)}\n\n${task}`,
  });
  return text.trim();
}

/** The area chair weighs the final positions and writes the consolidated decision. */
export async function runAreaChair(params: {
  agent: DebateAgentInfo;
  manuscript: string;
  positions: DebatePosition[];
}): Promise<string> {
  const { agent, manuscript, positions } = params;
  const { text } = await generateText({
    model: modelForPersona(AREA_CHAIR_PERSONA),
    system: agent.systemPrompt,
    prompt:
      `${manuscriptBlock(manuscript)}\n\nThese are the reviewers' final positions after the debate:\n\n` +
      positions.map((p) => `<review reviewer="${p.name}">\n${p.content}\n</review>`).join("\n\n") +
      `\n\nAs Area Chair, write the consolidated decision: an overall recommendation, the points the reviewers agree on, how you resolve their disagreements, and a prioritized revision plan for the authors.`,
  });
  return text.trim();
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
