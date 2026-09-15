import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

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
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4000,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const content = response.content[0];
    if (content.type === "text") {
      let text = content.text.trim();
      // Remove markdown code blocks if the LLM includes them despite instructions
      if (text.startsWith("```python")) {
        text = text.replace(/^```python\r?\n/, "").replace(/\r?\n```$/, "");
      }
      return text;
    }
    
    throw new Error("Failed to generate Python script.");
  } catch (error) {
    console.error("Error generating Python script:", error);
    throw error;
  }
}
