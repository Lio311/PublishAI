import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { Stage, AgentResult } from "../base-agent";

export const PublishAIStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  paperId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  targetJournalId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  previousJournalId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  action: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  currentStage: Annotation<Stage>({
    reducer: (x, y) => y ?? x,
    default: () => "clarification" as Stage,
  }),
  documentContent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  previousStageOutputs: Annotation<Map<Stage, AgentResult>>({
    reducer: (x, y) => {
      let newMap: Map<Stage, AgentResult>;
      if (x instanceof Map) {
        newMap = new Map(x);
      } else if (x && typeof x === "object") {
        newMap = new Map(Object.entries(x) as [Stage, AgentResult][]);
      } else {
        newMap = new Map<Stage, AgentResult>();
      }

      if (!y) return newMap;

      if (y instanceof Map) {
        y.forEach((value, key) => newMap.set(key, value));
      } else if (typeof y === "object") {
        Object.entries(y).forEach(([key, value]) => {
          newMap.set(key as Stage, value as AgentResult);
        });
      }
      return newMap;
    },
    default: () => new Map<Stage, AgentResult>(),
  }),
  reviewerComments: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  rebuttalStrategy: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  rebuttalLetter: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "default_user",
  }),
  memoryContext: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  humanFeedback: Annotation<string | null>({
    reducer: (x, y) => y !== undefined ? y : x,
    default: () => null,
  }),
  validationErrors: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  clarification: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  plan: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  literature: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  scientificReview: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  draft: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  edits: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  integrityResult: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  qa: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  verification: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  coverLetter: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  journalRules: Annotation<Record<string, any>>({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  knowledgeContext: Annotation<string>({
    reducer: (x, y) => x + (y ? "\n" + y : ""),
    default: () => "",
  }),
  rebuttal: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  dataSchema: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  dataWarnings: Annotation<any[]>({
    reducer: (x, y) => (y ? (Array.isArray(y) ? [...x, ...y] : [...x, y]) : x),
    default: () => [],
  }),
});

export type PublishAIState = typeof PublishAIStateAnnotation.State;

export function getPreviousStageOutput(state: PublishAIState, stage: Stage): AgentResult | undefined {
  if (!state.previousStageOutputs) return undefined;
  if (state.previousStageOutputs instanceof Map) {
    return state.previousStageOutputs.get(stage);
  }
  return (state.previousStageOutputs as Record<string, AgentResult>)?.[stage];
}
