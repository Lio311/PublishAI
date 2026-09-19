import { analyzeFigureWithVisionAi } from "./visionAi.service";
import { runPythonInSandbox } from "./e2bService";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function verifyStatisticalSignificance(
  imageUrl: string,
  legend: string,
  claims: string[]
): Promise<{ verified: boolean; logs: string; details: any }> {
  // 1. Extract data points from the chart using Vision AI (we augment the prompt)
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const { object: extractedData } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      dataPoints: z.array(z.object({
        group: z.string(),
        mean: z.number(),
        stdDev: z.number().optional(),
        n: z.number().optional(),
      })),
      extractedClaims: z.array(z.string()),
    }),
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: imageBuffer },
          {
            type: "text",
            text: `Extract the means, standard deviations, and sample sizes from this chart. The legend is: "${legend}". Claims to verify: ${claims.join(", ")}`,
          },
        ],
      },
    ],
  });

  // 2. Generate a Python script to run a t-test or ANOVA on the extracted data
  const { object: scriptInfo } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      pythonCode: z.string(),
    }),
    messages: [
      {
        role: "user",
        content: `Write a short Python script using scipy.stats to verify if the following data supports the claims: ${claims.join(", ")}. 
Data: ${JSON.stringify(extractedData.dataPoints)}
The script should print "VERIFIED: TRUE" if the claims hold, or "VERIFIED: FALSE" otherwise, along with the p-values.
Do not include markdown blocks like \`\`\`python in the output, just the raw python code.`,
      },
    ],
  });

  // 3. Execute the script in E2B
  const { logs } = await runPythonInSandbox(scriptInfo.pythonCode, []);

  const verified = logs.includes("VERIFIED: TRUE");

  return {
    verified,
    logs,
    details: extractedData,
  };
}
