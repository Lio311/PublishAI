import { generateObject } from 'ai';
import { z } from 'zod';
import { AI_MODELS } from '@/lib/ai/provider';

export class FixCodeAgent {
  /**
   * Analyzes stderr from an E2B Sandbox execution and outputs patched code and dependencies.
   */
  async patchBrokenCode(originalCode: string, stderr: string, existingDependencies: string[]): Promise<{
    fixedCode: string;
    newDependencies: string[];
    explanation: string;
  }> {
    
    const prompt = `You are an expert Python debugging agent for a scientific publishing platform.
The user uploaded research code that failed to execute in our secure sandbox.

Original Code:
\`\`\`python
${originalCode}
\`\`\`

Existing Dependencies: [${existingDependencies.join(', ')}]

Execution Stderr / Stack Trace:
${stderr}

Your task:
1. Analyze the error. Is it a missing package? (e.g. ModuleNotFoundError)
2. Is it a hardcoded file path error? (e.g. FileNotFoundError)
3. Fix the code to use generic/mock paths or standard dataset loaders if they uploaded data.
4. Add any missing packages to the dependency list.

Return a strictly typed JSON object containing the fixed code, the updated array of dependencies, and a brief explanation of the fix.`;

    const { object } = await generateObject({
      model: AI_MODELS.coding,
      schema: z.object({
        fixedCode: z.string().describe("The fully corrected Python script."),
        newDependencies: z.array(z.string()).describe("The complete, updated list of pip dependencies needed to run the script."),
        explanation: z.string().describe("A human-readable explanation of what was fixed (e.g., 'Added missing pandas dependency and fixed file path.').")
      }),
      prompt
    });

    return object;
  }
}

export const fixCodeAgent = new FixCodeAgent();
