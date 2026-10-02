/**
 * Client-side shapes of API JSON responses. Rows come from the Drizzle schema,
 * with Date columns serialized to ISO strings by JSON.
 */
import type {
  AgentEvaluation,
  Submission,
  journalConnections,
  debateMessages,
  generatedCharts,
  figures,
  figureAnalyses,
} from "@/services/db/schema";

type JsonValue<V> = V extends Date ? string : V;

/** A database row as received over JSON (Dates become strings). */
export type Jsonified<T> = { [K in keyof T]: JsonValue<T[K]> };

/** Connections are returned without their encrypted credentials. */
export type JournalConnectionDto = Omit<
  Jsonified<typeof journalConnections.$inferSelect>,
  "encryptedUsername" | "encryptedPassword"
>;

export type SubmissionDto = Jsonified<Submission> & {
  connection?: Partial<JournalConnectionDto> | null;
  paper?: { title: string } | null;
};

export type DebateMessageDto = Jsonified<typeof debateMessages.$inferSelect>;

export type GeneratedChartDto = Jsonified<typeof generatedCharts.$inferSelect>;

export type FigureAnalysisDto = Jsonified<typeof figureAnalyses.$inferSelect>;

export type FigureDto = Jsonified<typeof figures.$inferSelect> & { analyses?: FigureAnalysisDto[] };

export type AgentEvaluationDto = Jsonified<AgentEvaluation>;

/** Error payload returned by API routes. */
export interface ApiErrorBody {
  error?: string;
  code?: string;
  message?: string;
}
