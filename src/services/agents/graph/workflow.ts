import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { PublishAIStateAnnotation, PublishAIState } from "./state";
import { clarificationNode } from "./nodes/clarificationNode";
import { planningNode } from "./nodes/planningNode";
import { literatureNode } from "./nodes/literatureNode";
import { executionNode } from "./nodes/executionNode";
import { scientificReviewNode } from "./nodes/scientificReviewNode";
import { draftNode } from "./nodes/draftNode";
import { editsNode } from "./nodes/editsNode";
import { integrityNode } from "./nodes/integrityNode";
import { qaNode } from "./nodes/qaNode";
import { verificationNode } from "./nodes/verificationNode";
import { coverLetterNode } from "./nodes/coverLetterNode";
import { retrieveMemoryNode, updateMemoryNode } from "./nodes/memoryNode";
import { guardrailsNode } from "./nodes/guardrailsNode";
import { rebuttalNode } from "./nodes/rebuttalNode";

const routeAfterIntegrity = (state: PublishAIState) => {
  // If integrity fails, route to END or error state.
  // Assuming a fail condition is represented when integrityResult has some error or "fail" property,
  // we'll route to END for now as per instructions.
  if (state.integrityResult === "fail" || state.integrityResult?.status === "fail" || state.integrityResult?.success === false) {
    return END;
  }
  return "qaNode";
};

const routeFromStart = (state: PublishAIState) => {
  if (state.reviewerComments) {
    return "rebuttalNode";
  }
  return "clarificationNode";
};

const builder = new StateGraph(PublishAIStateAnnotation)
  .addNode("clarificationNode", clarificationNode)
  .addNode("planningNode", planningNode)
  .addNode("literatureNode", literatureNode)
  .addNode("executionNode", executionNode)
  .addNode("scientificReviewNode", scientificReviewNode)
  .addNode("draftNode", draftNode)
  .addNode("editsNode", editsNode)
  .addNode("integrityNode", integrityNode)
  .addNode("qaNode", qaNode)
  .addNode("verificationNode", verificationNode)
    .addNode("coverLetterNode", coverLetterNode)
  .addNode("retrieveMemoryNode", retrieveMemoryNode)
  .addNode("updateMemoryNode", updateMemoryNode)
  .addNode("guardrailsNode", guardrailsNode)
  .addNode("rebuttalNode", rebuttalNode)

  .addConditionalEdges(START, routeFromStart)
  .addEdge("rebuttalNode", "executionNode")
  .addEdge("clarificationNode", "planningNode")
  .addEdge("planningNode", "literatureNode")
  .addEdge("literatureNode", "executionNode")
  .addEdge("executionNode", "scientificReviewNode")
  .addEdge("scientificReviewNode", "retrieveMemoryNode")
  .addEdge("retrieveMemoryNode", "draftNode")
  .addEdge("draftNode", "guardrailsNode")
  .addEdge("guardrailsNode", "editsNode")
  .addEdge("editsNode", "integrityNode")
  .addConditionalEdges("integrityNode", routeAfterIntegrity)
  .addEdge("qaNode", "verificationNode")
  .addEdge("verificationNode", "coverLetterNode")
  .addEdge("coverLetterNode", "updateMemoryNode")
  .addEdge("updateMemoryNode", END);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const checkpointer = new PostgresSaver(pool);

export const publishAiGraph = builder.compile({
  checkpointer,
  interruptBefore: ["qaNode"],
});
