import { generateText } from "ai";
import { AI_MODELS } from "@/services/ai/provider";

/**
 * @description Analyzes the paper text and generates a Python script to verify the statistical claims against the data.
 */
export async function generateAnalysisScript(
  paperContent: string,
  dataSchemas: string[] // Columns and types for the data
): Promise<string> {
  const prompt = `
You are a Data Analyst AI. I will provide you with the text of a scientific paper and the schemas of its uploaded data files.
Your task is to write a Python script that will:
1. Load the data files based on the schemas provided.
2. Verify the statistical claims made in the paper (e.g., P-values, correlations, means).
3. Generate matplotlib visualizations to highlight any discrepancies found between the claims and the actual data.
4. The Python script will be executed in a Jupyter-like environment.
5. Output ONLY the raw Python code without any markdown blocks or backticks.

Data Schemas:
${dataSchemas.join("\\n")}

Paper Content:
${paperContent}
`;

  try {
    const { text } = await generateText({
      model: AI_MODELS.coding,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    let scriptText = text.trim();
    // Remove markdown code blocks if the LLM includes them despite instructions
    if (scriptText.startsWith("```python")) {
      scriptText = scriptText.replace(/^```python\r?\n/, "").replace(/\r?\n```$/, "");
    }
    return scriptText;
    
  } catch (error) {
    console.error("Error generating Python script:", error);
    // Bubble up error
    throw new Error("Failed to generate analysis script.", { cause: error });
  }
}
