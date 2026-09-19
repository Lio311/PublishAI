import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function fetchCrossDomainAnalogies(problemStatement: string, domain: string = "science"): Promise<string[]> {
  // Simulates analogical reasoning (AR) by prompting the LLM to extract the core abstract problem,
  // map it to diverse domains, and retrieve novel analogies to prevent mode collapse.
  const prompt = `You are an expert in Analogical Reasoning (AR).
Abstract the core structural mechanism of the following problem in the domain of ${domain}:
Problem: "${problemStatement}"

Then, retrieve 3 concrete, cross-domain analogies that solve a structurally similar problem. For each analogy, briefly explain the mapping to the original problem.
Return only the analogies as a numbered list.`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
  });

  // Simple parsing of numbered list
  const analogies = text.split(/\d+\.\s+/).filter(a => a.trim().length > 0).map(a => a.trim());
  return analogies.slice(0, 3);
}
