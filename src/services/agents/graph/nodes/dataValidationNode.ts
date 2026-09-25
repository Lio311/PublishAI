import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { runPythonInSandbox } from "../../../e2bService";
import { z } from "zod";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const dataValidationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    callbacks: [langfuseLangchainHandler],
  });

  // 1. Generate Python script
  const scriptSchema = z.object({
    script: z.string().describe("A python script that uses pandas and scipy to validate the statistics based on the document text and the data schema."),
  });

  const scriptModel = model.withStructuredOutput(scriptSchema);
  const scriptPrompt = `Write a Python script using pandas and scipy to validate the statistical claims made in the text based on the provided data schema.

Text:
${state.documentContent}

Data Schema:
${JSON.stringify(state.dataSchema)}
`;

  const scriptResult = await scriptModel.invoke([new HumanMessage(scriptPrompt)]);
  
  // 2. Execute Python
    const dataUrl = state.dataSchema?.url || "https://example.com/mock.csv";
  const safeScript = scriptResult.script; // e2bService runs it safely via runCode
  let pythonOutput;
  try {
    const e2bResult = await runPythonInSandbox(safeScript, [{ filename: "data.csv", url: dataUrl }]);
    pythonOutput = e2bResult.logs + "\n" + JSON.stringify(e2bResult.results);
  } catch (e: any) {
    console.error("E2B execution failed", e);
    pythonOutput = "Execution failed: " + e.message;
  }

  // 3. Compare output and generate annotations
  const annotationSchema = z.object({
    annotations: z.array(z.object({
      textAnchor: z.string().describe("The exact text anchor from the document that this annotation applies to."),
      warning: z.string().describe("The warning message explaining the discrepancy between the text and the calculated statistics."),
    })).describe("List of discrepancies found"),
  });

  const annotationModel = model.withStructuredOutput(annotationSchema);
  const annotationPrompt = `Compare the python output with the text and generate a list of annotations for any statistical discrepancies.

Text:
${state.documentContent}

Python Output:
${JSON.stringify(pythonOutput)}
`;

  const annotationResult = await annotationModel.invoke([new HumanMessage(annotationPrompt)]);

  return {
    dataWarnings: annotationResult.annotations,
  };
};
