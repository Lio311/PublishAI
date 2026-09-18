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
});

export type PublishAIState = typeof PublishAIStateAnnotation.State;
