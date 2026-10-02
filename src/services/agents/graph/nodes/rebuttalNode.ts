import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { PublishAIState } from "../state";
import { OPENAI_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";

const RebuttalOutput = z.object({
  rebuttalStrategy: z.string().describe("The strategy for addressing the reviewer comments."),
  rebuttalLetter: z.string().describe("The drafted rebuttal letter."),
});

export async function rebuttalNode(state: PublishAIState): Promise<Partial<PublishAIState>> {
  const model = new ChatOpenAI({
    model: OPENAI_MODELS.standard,
    temperature: 0,
  }).withStructuredOutput(RebuttalOutput);

  const reviewerComments = state.reviewerComments || "No reviewer comments specified.";
  const documentContent = state.documentContent || "No document content provided.";

  const prompt = `You are an academic rebuttal generator.
Please analyze the following document content and reviewer comments, then formulate a rebuttal strategy and draft a rebuttal letter.

Document Content:
${documentContent}

Reviewer Comments:
${reviewerComments}
`;

  try {
    const result = await model.invoke(prompt);

    return {
      rebuttal: result,
      rebuttalStrategy: result.rebuttalStrategy,
      rebuttalLetter: result.rebuttalLetter,
      currentStage: "rebuttal",
    };
  } catch (error) {
    console.error("[rebuttalNode] Failed to generate rebuttal:", error);
    const fallbackStrategy = `Rebuttal generation failed: ${errorMessage(error) || "Unknown error"}`;
    return {
      rebuttal: {
        rebuttalStrategy: fallbackStrategy,
        rebuttalLetter: fallbackStrategy,
      },
      rebuttalStrategy: fallbackStrategy,
      rebuttalLetter: fallbackStrategy,
      currentStage: "rebuttal",
    };
  }
}
