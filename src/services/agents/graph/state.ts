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
      const newMap = new Map(x);
      y.forEach((value, key) => newMap.set(key, value));
      return newMap;
    },
    default: () => new Map<Stage, AgentResult>(),
  }),
  reviewerComments: Annotation<string>({
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
  knowledgeContext: Annotation<string>({
    reducer: (x, y) => x + (y ? "\n" + y : ""),
    default: () => "",
  }),
});

export type PublishAIState = typeof PublishAIStateAnnotation.State;
