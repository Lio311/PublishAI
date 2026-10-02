import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { SYSTEM_PROMPT_GUARDRAILS, wrapPromptContext } from "@/services/ai/promptSanitizer";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";
import {
  FinalRankingSchema,
  JournalEvaluationSchema,
  ManuscriptProfileSchema,
  ProposedJournalsSchema,
  type FinalRanking,
  type JournalCandidate,
  type JournalEvaluation,
  type ManuscriptProfile,
  type MatchPreferences,
  type ProposedJournals,
} from "./types";

export const JOURNAL_MATCH_MODEL = process.env.JOURNAL_MATCH_MODEL || ANTHROPIC_MODELS.reasoning;

export class AgentError extends Error {
  constructor(message: string, public code: "AI_NOT_CONFIGURED" | "AI_REFUSED" | "AI_INVALID_OUTPUT" | "AI_FAILED") {
    super(message);
    this.name = "AgentError";
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new AgentError("ANTHROPIC_API_KEY is not configured", "AI_NOT_CONFIGURED");
  }
  client ??= new Anthropic();
  return client;
}

interface StructuredCall<S extends z.ZodType> {
  agent: string;
  system: string;
  prompt: string;
  schema: S;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
}

/**
 * Runs one agent turn and returns schema-validated output. Server-side fallbacks
 * are enabled so a safety-classifier decline is retried on a fallback model
 * instead of failing the whole match.
 */
async function runStructuredAgent<S extends z.ZodType>(call: StructuredCall<S>): Promise<z.infer<S>> {
  const anthropic = getClient();

  let response;
  try {
    response = await anthropic.beta.messages.parse({
      model: JOURNAL_MATCH_MODEL,
      max_tokens: call.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `${call.system}\n\n${SYSTEM_PROMPT_GUARDRAILS}`,
      messages: [{ role: "user", content: call.prompt }],
      output_config: {
        effort: call.effort,
        format: betaZodOutputFormat(call.schema),
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AgentError("Anthropic API key was rejected", "AI_NOT_CONFIGURED");
    }
    if (error instanceof Anthropic.APIError) {
      throw new AgentError(`[${call.agent}] Claude API error ${error.status}: ${error.message}`, "AI_FAILED");
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new AgentError(`[${call.agent}] The model declined this request`, "AI_REFUSED");
  }
  if (!response.parsed_output) {
    throw new AgentError(`[${call.agent}] Model output did not match the expected schema`, "AI_INVALID_OUTPUT");
  }
  return response.parsed_output as z.infer<S>;
}

// ═══════════════════════════════════════════════════════
// Agent 1 — Manuscript Profiler
// ═══════════════════════════════════════════════════════

export function profileManuscript(manuscriptText: string): Promise<ManuscriptProfile> {
  return runStructuredAgent({
    agent: "profiler",
    effort: "medium",
    schema: ManuscriptProfileSchema,
    system:
      "You are a senior handling editor who triages incoming manuscripts. You read a manuscript and produce a precise, " +
      "honest profile that other editors will use to decide which journal it belongs in. Calibrate novelty and rigor " +
      "against the whole field, not against the authors' own claims; most solid papers are 'solid', not 'significant'.",
    prompt: `Profile the manuscript below. Search queries must be in English even if the manuscript is not.

${wrapPromptContext("manuscript_text", manuscriptText, "Full manuscript text extracted from the uploaded file")}`,
  });
}

function describeProfile(profile: ManuscriptProfile): string {
  return [
    `Title: ${profile.title}`,
    `Field / subfield: ${profile.field} / ${profile.subfield}`,
    `Article type: ${profile.articleType}`,
    `Study design: ${profile.studyDesign}`,
    `Summary: ${profile.summary}`,
    `Key contributions: ${profile.keyContributions.join("; ")}`,
    `Keywords: ${profile.keywords.join(", ")}`,
    `Audience: ${profile.audience}`,
    `Novelty: ${profile.noveltyLevel}; Rigor: ${profile.methodologicalRigor}`,
    `Approx. word count: ${profile.wordCountEstimate}`,
  ].join("\n");
}

function describePreferences(prefs: MatchPreferences): string {
  const priority = {
    balanced: "a balance between journal prestige and realistic acceptance",
    impact: "the highest-impact journal that still gives a realistic chance",
    speed: "a high likelihood of acceptance and fast publication",
  }[prefs.priority];
  const lines = [`Author priority: ${priority}.`];
  if (prefs.openAccessOnly) lines.push("Only open-access journals are acceptable.");
  if (prefs.maxApcUsd != null) lines.push(`Article processing charge must not exceed USD ${prefs.maxApcUsd}.`);
  return lines.join(" ");
}

// ═══════════════════════════════════════════════════════
// Agent 2 — Editor (proposes candidates from domain knowledge)
// Every proposal is verified against OpenAlex before use.
// ═══════════════════════════════════════════════════════

export function proposeJournals(profile: ManuscriptProfile, prefs: MatchPreferences): Promise<ProposedJournals> {
  return runStructuredAgent({
    agent: "editor",
    effort: "low",
    schema: ProposedJournalsSchema,
    system:
      "You are an experienced academic publishing consultant with deep knowledge of journal scopes across disciplines. " +
      "Propose real journals only; each name will be verified against a bibliographic database and unknown names are discarded.",
    prompt: `Propose journals where this manuscript would be a natural fit. Spread the list across selectivity levels:
a few top specialty journals, several solid field journals, and a couple of reliable broader outlets.
${describePreferences(prefs)}

${wrapPromptContext("manuscript_profile", describeProfile(profile))}`,
  });
}

// ═══════════════════════════════════════════════════════
// Agent 3 — Fit Evaluator (one independent instance per journal)
// ═══════════════════════════════════════════════════════

function describeCandidate(candidate: JournalCandidate): string {
  const m = candidate.metrics;
  const lines = [
    `Journal: ${m.name}${m.publisher ? ` (${m.publisher})` : ""}`,
    `Main topics: ${m.topics.join(", ") || "unknown"}`,
    `2-year mean citedness (impact proxy): ${m.citedness2yr ?? "unknown"}; h-index: ${m.hIndex ?? "unknown"}; total articles: ${m.worksCount}`,
    `Open access: ${m.isOpenAccess ? "yes" : "no"}${m.isInDoaj ? " (DOAJ indexed)" : ""}; APC: ${m.apcUsd != null ? `USD ${m.apcUsd}` : "unknown"}`,
    `Similar articles it published in the last 5 years: ${candidate.similarArticleCount}`,
  ];
  if (candidate.exampleWorks.length > 0) {
    lines.push(`Examples: ${candidate.exampleWorks.map((w) => `"${w.title}" (${w.year ?? "n.d."})`).join("; ")}`);
  }
  return lines.join("\n");
}

function outputLanguage(locale: string): string {
  return locale === "he" ? "Hebrew (keep journal names in their original English)" : "English";
}

export function evaluateJournalFit(
  profile: ManuscriptProfile,
  candidate: JournalCandidate,
  locale: string
): Promise<JournalEvaluation> {
  return runStructuredAgent({
    agent: `evaluator:${candidate.metrics.name}`,
    effort: "low",
    schema: JournalEvaluationSchema,
    maxTokens: 4000,
    system:
      "You are a reviewer-editor assessing whether one specific journal is the right home for a manuscript. " +
      "Be specific and skeptical: base scope judgements on what the journal actually publishes, and judge level " +
      "fit in both directions (a top journal for an incremental study is a poor fit, and so is a weak journal for a breakthrough).",
    prompt: `Assess the fit between this manuscript and this journal. Write strengths and concerns in ${outputLanguage(locale)}.

${wrapPromptContext("manuscript_profile", describeProfile(profile))}

${wrapPromptContext("journal_evidence", describeCandidate(candidate), "Bibliometric data from OpenAlex")}`,
  });
}

// ═══════════════════════════════════════════════════════
// Agent 4 — Chief Editor (final ranking and explanation)
// ═══════════════════════════════════════════════════════

export function rankFinalists(
  profile: ManuscriptProfile,
  finalists: JournalCandidate[],
  prefs: MatchPreferences,
  locale: string
): Promise<FinalRanking> {
  const dossier = finalists
    .map((c) => {
      const e = c.evaluation!;
      return [
        `id: ${c.id}`,
        describeCandidate(c),
        `Composite score: ${c.score}/100 (scope ${e.scopeFit}, level ${e.levelFit}, outlook ${e.acceptanceOutlook})`,
        `Evaluator strengths: ${e.strengths.join("; ") || "-"}`,
        `Evaluator concerns: ${e.concerns.join("; ") || "-"}`,
      ].join("\n");
    })
    .join("\n\n");

  return runStructuredAgent({
    agent: "chief-editor",
    effort: "medium",
    schema: FinalRankingSchema,
    system:
      "You are the chief editor who gives the author a final, prioritized submission plan. " +
      "You choose exactly three journals from the finalists and explain the choice with the evidence provided. " +
      "The composite score reflects independent evaluations; follow it unless the evidence gives a clear reason not to, " +
      "and say so in the rationale when you deviate.",
    prompt: `Pick the three best journals for this manuscript, in the order the author should submit.
${describePreferences(prefs)}
Write overview, rationale and preparationTips in ${outputLanguage(locale)}.

${wrapPromptContext("manuscript_profile", describeProfile(profile))}

${wrapPromptContext("finalists", dossier, "Candidate journals with evaluations")}`,
  });
}
