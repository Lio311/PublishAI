import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const VisionActionSchema = z.object({
  action: z.enum(['click', 'type', 'select', 'scroll', 'none']),
  selector: z.string().optional().describe('CSS selector if identifiable from page structure'),
  value: z.string().optional().describe('Text to type if action is type'),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe('Pixel coordinates for click when no CSS selector is identifiable'),
  reasoning: z.string().describe('Brief explanation of why this action was chosen'),
});

export type VisionAIAction = z.infer<typeof VisionActionSchema>;

/**
 * Analyzes a screenshot of a web page using Claude Vision to determine
 * the next browser automation action when DOM selectors fail.
 * 
 * This is the fallback layer — only called when standard Playwright
 * selectors cannot find the expected elements.
 * 
 * @param screenshotBuffer PNG screenshot buffer from Playwright
 * @param instruction What action we're trying to accomplish
 * @param pageContext Optional context about the current page (title, URL)
 * @returns Structured action to execute on the page
 */
export async function analyzeScreenshot(
  screenshotBuffer: Buffer,
  instruction: string,
  pageContext?: string
): Promise<VisionAIAction> {
  if (!screenshotBuffer || screenshotBuffer.length === 0) {
    return {
      action: 'none',
      reasoning: 'Screenshot buffer is empty or invalid.',
    };
  }

  try {
    const visionModelName = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';

    const { object } = await generateObject({
      model: anthropic(visionModelName),
      schema: VisionActionSchema,
      messages: [
        {
          role: 'system',
          content: `You are a browser automation assistant analyzing screenshots of academic journal submission portals. Your job is to identify form fields, buttons, dropdowns, and navigation elements visually.

Rules:
- Prefer CSS selectors when you can infer them from visual cues (e.g., visible IDs, placeholder text patterns).
- Use pixel coordinates only when no selector can be inferred.
- For 'type' actions, always provide the 'value' field.
- Return 'none' action only if the instruction cannot be accomplished from the visible page.
- Be precise — wrong clicks on journal portals can cause submission errors.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: screenshotBuffer,
            },
            {
              type: 'text',
              text: `Task: ${instruction}\n${pageContext ? `Current page context: ${pageContext}` : ''}\n\nAnalyze the screenshot and determine the single best action to accomplish this task.`,
            },
          ],
        },
      ],
    });

    console.log(`[VisionAI] Action determined: ${object.action} — ${object.reasoning}`);
    return object;
  } catch (error) {
    console.error('[VisionAI] Analysis failed:', error);
    return {
      action: 'none',
      reasoning: `Vision AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Runs a multi-step Vision AI loop: take screenshot → analyze → execute → repeat.
 * Useful for complex multi-step form interactions where DOM structure is unknown.
 * 
 * @param page Playwright Page instance
 * @param goal Goal description
 * @param maxSteps Maximum number of vision-guided steps before giving up
 */
export async function runVisionLoop(
  page: import('playwright').Page,
  goal: string,
  maxSteps: number = 5
): Promise<VisionAIAction[]> {
  const actions: VisionAIAction[] = [];

  for (let i = 0; i < maxSteps; i++) {
    if (!page || (typeof page.isClosed === 'function' && page.isClosed())) {
      console.warn(`[VisionAI] Page is closed, terminating vision loop at step ${i + 1}`);
      break;
    }

    let screenshot: Buffer;
    let pageTitle = '';
    let pageUrl = '';

    try {
      screenshot = await page.screenshot({ fullPage: false, timeout: 5000 });
      pageTitle = await page.title().catch(() => '');
      pageUrl = page.url();
    } catch (captureErr) {
      console.error(`[VisionAI] Screenshot capture failed at step ${i + 1}:`, captureErr);
      break;
    }

    const action = await analyzeScreenshot(
      screenshot,
      `Step ${i + 1} of goal: ${goal}`,
      `Page: ${pageTitle} | URL: ${pageUrl}`
    );

    actions.push(action);

    if (action.action === 'none') {
      console.log(`[VisionAI] Loop ended at step ${i + 1}: no action possible`);
      break;
    }

    // Execute the action safely with timeouts and error boundary
    try {
      switch (action.action) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector, { timeout: 5000 });
          } else if (action.coordinates) {
            await page.mouse.click(action.coordinates.x, action.coordinates.y);
          }
          break;
        case 'type':
          if (action.selector && action.value) {
            await page.fill(action.selector, action.value, { timeout: 5000 });
          }
          break;
        case 'select':
          if (action.selector && action.value) {
            await page.selectOption(action.selector, action.value, { timeout: 5000 });
          }
          break;
        case 'scroll':
          await page.mouse.wheel(0, 300);
          break;
      }
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    } catch (execError) {
      console.error(`[VisionAI] Failed to execute action at step ${i + 1}:`, execError);
    }
  }

  return actions;
}
