import { z } from "zod";

// ═══════════════════════════════════════════════════════
// Agent output schemas (Claude structured outputs)
// Numeric ranges are described rather than enforced in the schema because
// structured outputs reject min/max constraints; values are clamped in code.
// ═══════════════════════════════════════════════════════

export const ManuscriptProfileSchema = z.object({
  title: z.string().describe("The manuscript title, or a concise inferred title if none is present"),
  field: z.string().describe("Broad discipline, e.g. 'Medicine', 'Computer Science', 'Ecology'"),
  subfield: z.string().describe("Specific subfield, e.g. 'Ophthalmology', 'Computer Vision'"),
  articleType: z.string().describe("e.g. 'Original Research', 'Systematic Review', 'Meta-analysis', 'Case Report', 'Methods', 'Short Communication'"),
  studyDesign: z.string().describe("Methodology in one sentence, e.g. 'Retrospective multicenter cohort, n=12,400'"),
  summary: z.string().describe("3-4 sentence neutral summary of the research question, methods and main findings"),
  keyContributions: z.array(z.string()).describe("2-5 concrete contributions claimed by the manuscript"),
  keywords: z.array(z.string()).describe("6-10 specific keywords a database indexer would assign"),
  searchQueries: z
    .array(z.string())
    .describe(
      "3 short literature-search phrases (3-6 words each, English, no boolean operators) that would retrieve papers on the same topic: one narrow, one medium, one broader"
    ),
  audience: z.string().describe("Who would read this: e.g. 'clinical ophthalmologists', 'ML researchers', 'policy makers'"),
  noveltyLevel: z
    .enum(["incremental", "solid", "significant", "breakthrough"])
    .describe("Honest assessment of how novel and broadly important the findings are"),
  methodologicalRigor: z
    .enum(["weak", "adequate", "strong", "exceptional"])
    .describe("Honest assessment of sample size, controls, validation and statistics"),
  wordCountEstimate: z.number().describe("Approximate main-text word count"),
  language: z.string().describe("Language the manuscript is written in"),
});
export type ManuscriptProfile = z.infer<typeof ManuscriptProfileSchema>;

export const ProposedJournalsSchema = z.object({
  journals: z
    .array(
      z.object({
        name: z.string().describe("Exact official journal name as listed by the publisher"),
        why: z.string().describe("One sentence on why it could fit"),
      })
    )
    .describe("8-12 real, currently active, peer-reviewed journals; no predatory or discontinued titles"),
});
export type ProposedJournals = z.infer<typeof ProposedJournalsSchema>;

export const JournalEvaluationSchema = z.object({
  scopeFit: z.number().describe("0-100: how well the topic and article type match the journal's stated scope and what it actually publishes"),
  levelFit: z
    .number()
    .describe("0-100: how well the manuscript's novelty and rigor match the journal's selectivity. 100 = ideal match; low if the journal is far above OR far below the manuscript's level"),
  acceptanceOutlook: z.enum(["low", "moderate", "good", "high"]).describe("Realistic chance of acceptance after peer review"),
  isReputable: z.boolean().describe("false if the venue is predatory, a mega-volume low-quality outlet, discontinued, or not a peer-reviewed journal"),
  strengths: z.array(z.string()).describe("1-3 specific reasons this journal suits this manuscript"),
  concerns: z.array(z.string()).describe("0-3 specific risks, e.g. scope mismatch, word limit, needs external validation"),
});
export type JournalEvaluation = z.infer<typeof JournalEvaluationSchema>;

export const FinalRankingSchema = z.object({
  overview: z.string().describe("2-3 sentences describing the publication strategy across the three choices"),
  recommendations: z
    .array(
      z.object({
        candidateId: z.string().describe("The id of the chosen candidate, copied exactly"),
        rank: z.number().describe("1, 2 or 3 (1 = submit here first)"),
        strategy: z.enum(["ambitious", "target", "safe"]).describe("Role of this journal in the submission plan"),
        rationale: z.string().describe("3-5 sentences explaining why this journal, grounded in the evidence provided"),
        preparationTips: z.array(z.string()).describe("2-4 concrete things to change before submitting here"),
      })
    )
    .describe("Exactly 3 recommendations ordered by priority"),
});
export type FinalRanking = z.infer<typeof FinalRankingSchema>;

// ═══════════════════════════════════════════════════════
// Pipeline data types
// ═══════════════════════════════════════════════════════

export type MatchPriority = "balanced" | "impact" | "speed";

export interface MatchPreferences {
  priority: MatchPriority;
  openAccessOnly: boolean;
  maxApcUsd?: number | null;
  /** Journals to leave out, e.g. the one that just rejected the paper. */
  excludeJournalNames?: string[];
}

export interface JournalMetrics {
  openAlexId: string;
  name: string;
  issn: string | null;
  publisher: string | null;
  homepageUrl: string | null;
  worksCount: number;
  citedness2yr: number | null;
  hIndex: number | null;
  isOpenAccess: boolean;
  isInDoaj: boolean;
  apcUsd: number | null;
  topics: string[];
}

export interface SimilarWork {
  title: string;
  year: number | null;
  doi: string | null;
}

export interface JournalCandidate {
  id: string;
  metrics: JournalMetrics;
  /** Number of topically similar recent articles this journal published (OpenAlex). */
  similarArticleCount: number;
  /** Where the candidate came from: literature evidence, the editor agent, or both. */
  sources: Array<"literature" | "editor">;
  editorNote?: string;
  /** Matching journal in our own database (has formatting/submission rules). */
  internalJournalId?: number;
  exampleWorks: SimilarWork[];
  evaluation?: JournalEvaluation;
  score?: number;
}

export interface JournalRecommendation {
  rank: number;
  strategy: "ambitious" | "target" | "safe";
  rationale: string;
  preparationTips: string[];
  score: number;
  candidate: JournalCandidate;
}

export interface JournalMatchResult {
  profile: ManuscriptProfile;
  overview: string;
  recommendations: JournalRecommendation[];
  candidatesConsidered: number;
  generatedAt: string;
}

export type MatchStage = "extracting" | "profiling" | "searching" | "evaluating" | "ranking";

export type MatchProgressEvent =
  | { type: "stage"; stage: MatchStage; detail?: string }
  | { type: "result"; result: JournalMatchResult }
  | { type: "error"; error: string; code?: string };
