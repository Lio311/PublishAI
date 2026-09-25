import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { PublishAIStateAnnotation, PublishAIState } from "./state";
import { retrieveMemoryNode } from "./nodes/memoryNode";
import { writingNode } from "./nodes/writingNode";
import { validateNode } from "./nodes/validateNode";

const routeAfterValidation = (state: PublishAIState) => {
  if (state.validationErrors && state.validationErrors.length > 0) {
    return "writingNode"; // Fix errors
  }
  return "humanReview";
};

const routeAfterHuman = (state: PublishAIState) => {
  if (state.humanFeedback) {
    return "writingNode"; // Address feedback
  }
  return END;
};

// Human-in-the-loop node doesn't strictly need to do much besides wait.
// By returning an empty object, it doesn't change the state.
const humanReviewNode = async (state: PublishAIState) => {
  return {};
};

const builder = new StateGraph(PublishAIStateAnnotation)
  .addNode("memoryNode", retrieveMemoryNode)
  .addNode("writingNode", writingNode)
  .addNode("validateNode", validateNode)
  .addNode("humanReview", humanReviewNode)
  
  .addEdge(START, "memoryNode")
  .addEdge("memoryNode", "writingNode")
  .addEdge("writingNode", "validateNode")
  .addConditionalEdges("validateNode", routeAfterValidation)
  .addConditionalEdges("humanReview", routeAfterHuman);

const checkpointer = new MemorySaver();

// Compile the graph with a breakpoint BEFORE humanReview
export const publishAiGraph = builder.compile({
  checkpointer,
  interruptBefore: ["humanReview"]
});
