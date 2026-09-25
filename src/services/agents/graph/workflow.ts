import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { PublishAIStateAnnotation, PublishAIState } from "./state";
import { clarificationNode } from "./nodes/clarificationNode";
import { planningNode } from "./nodes/planningNode";
import { knowledgeNode } from "./nodes/knowledgeNode";
import { dataValidationNode } from "./nodes/dataValidationNode";
import { scientificReviewNode } from "./nodes/scientificReviewNode";
import { writingNode } from "./nodes/writingNode";
import { editsNode } from "./nodes/editsNode";
import { integrityNode } from "./nodes/integrityNode";
import { qaNode } from "./nodes/qaNode";
import { verificationNode } from "./nodes/verificationNode";
import { coverLetterNode } from "./nodes/coverLetterNode";
import { retrieveMemoryNode, updateMemoryNode } from "./nodes/memoryNode";
import { guardrailsNode } from "./nodes/guardrailsNode";
import { rebuttalNode } from "./nodes/rebuttalNode";
import { cascadeNode } from "./nodes/cascadeNode";

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
  if (state.action === 'cascade' || state.targetJournalId) {
    return "cascadeNode";
  }
  if (state.reviewerComments) {
    return "rebuttalNode";
  }
  return "clarificationNode";
};

const builder = new StateGraph(PublishAIStateAnnotation)
  .addNode("clarificationNode", clarificationNode)
  .addNode("planningNode", planningNode)
  .addNode("knowledgeNode", knowledgeNode)
  .addNode("dataValidationNode", dataValidationNode)
  .addNode("scientificReviewNode", scientificReviewNode)
  .addNode("writingNode", writingNode)
  .addNode("editsNode", editsNode)
  .addNode("integrityNode", integrityNode)
  .addNode("qaNode", qaNode)
  .addNode("verificationNode", verificationNode)
    .addNode("coverLetterNode", coverLetterNode)
  .addNode("retrieveMemoryNode", retrieveMemoryNode)
  .addNode("updateMemoryNode", updateMemoryNode)
  .addNode("guardrailsNode", guardrailsNode)
  .addNode("rebuttalNode", rebuttalNode)
  .addNode("cascadeNode", cascadeNode)

  .addConditionalEdges(START, routeFromStart)
  .addEdge("cascadeNode", "dataValidationNode")
  .addEdge("rebuttalNode", "dataValidationNode")
  .addEdge("clarificationNode", "planningNode")
  .addEdge("planningNode", "knowledgeNode")
  .addEdge("knowledgeNode", "dataValidationNode")
  .addEdge("dataValidationNode", "scientificReviewNode")
  .addEdge("scientificReviewNode", "retrieveMemoryNode")
  .addEdge("retrieveMemoryNode", "writingNode")
  .addEdge("writingNode", "guardrailsNode")
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
