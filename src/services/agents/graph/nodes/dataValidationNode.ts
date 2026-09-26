import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { runPythonInSandbox } from "../../../e2bService";
import { z } from "zod";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const dataValidationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  // If no dataSchema is provided or it's empty, skip data validation gracefully
  if (!state.dataSchema || (typeof state.dataSchema === "object" && Object.keys(state.dataSchema).length === 0)) {
    return {
      dataWarnings: [],
    };
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    callbacks: [langfuseLangchainHandler],
  });

  try {
    let pythonOutput = "";

    // If a dataset URL is provided, run sandbox statistical validation
    if (state.dataSchema.url) {
      const scriptSchema = z.object({
        script: z.string().describe("A python script that uses pandas and scipy to validate the statistics based on the document text and the data schema."),
      });

      const scriptModel = model.withStructuredOutput(scriptSchema);
      const scriptPrompt = `Write a Python script using pandas and scipy to validate the statistical claims made in the text based on the provided data schema.

Text:
${state.documentContent || ""}

Data Schema:
${JSON.stringify(state.dataSchema)}
`;

      const scriptResult = await scriptModel.invoke([new HumanMessage(scriptPrompt)]);
      const safeScript = scriptResult.script;

      try {
        const e2bResult = await runPythonInSandbox(safeScript, [{ filename: "data.csv", url: state.dataSchema.url }]);
        pythonOutput = (e2bResult.logs || "") + "\n" + JSON.stringify(e2bResult.results || {});
      } catch (e: any) {
        console.warn("[dataValidationNode] Sandbox execution failed:", e);
        pythonOutput = `Execution note: Sandbox execution unavailable (${e?.message || "error"}). Validating against schema directly.`;
      }
    } else {
      pythonOutput = `Schema structure: ${JSON.stringify(state.dataSchema)}`;
    }

    // Compare output and generate annotations
    const annotationSchema = z.object({
      annotations: z.array(z.object({
        textAnchor: z.string().describe("The exact text anchor from the document that this annotation applies to."),
        warning: z.string().describe("The warning message explaining the discrepancy between the text and the calculated statistics."),
      })).describe("List of discrepancies found"),
    });

    const annotationModel = model.withStructuredOutput(annotationSchema);
    const annotationPrompt = `Compare the data schema and statistical calculations with the manuscript text and generate a list of annotations for any statistical discrepancies.

Text:
${state.documentContent || ""}

Data/Execution Output:
${JSON.stringify(pythonOutput)}
`;

    const annotationResult = await annotationModel.invoke([new HumanMessage(annotationPrompt)]);

    return {
      dataWarnings: annotationResult.annotations || [],
    };
  } catch (error: any) {
    console.error("[dataValidationNode] Validation failed:", error);
    return {
      dataWarnings: [],
    };
  }
};
