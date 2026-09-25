import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { PublishAIState } from "../state";

const RebuttalOutput = z.object({
  rebuttalStrategy: z.string().describe("The strategy for addressing the reviewer comments."),
  rebuttalLetter: z.string().describe("The drafted rebuttal letter."),
});

export async function rebuttalNode(state: PublishAIState) {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  }).withStructuredOutput(RebuttalOutput);

  const prompt = `You are an academic rebuttal generator.
Please analyze the following document content and reviewer comments, then formulate a rebuttal strategy and draft a rebuttal letter.

Document Content:
${state.documentContent}

Reviewer Comments:
${state.reviewerComments}
`;

  const result = await model.invoke(prompt);

  return {
    rebuttal: result,
  };
}
