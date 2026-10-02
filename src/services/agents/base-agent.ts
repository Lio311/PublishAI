export type Stage = 
  | "clarification" 
  | "planning" 
  | "knowledge" 
  | "scientific_review" 
  | "writing" 
  | "execution" 
  | "qa" 
  | "verification" 
  | "compilation"
  | "cover_letter"
  | "rebuttal";

export interface AgentContext {
  paperId: string;
  manuscriptText: string;
  manuscriptStructure?: Record<string, unknown>; // To be typed later
  journalRules?: Record<string, unknown>;
  previousStageOutputs: Map<Stage, AgentResult>;
  references?: unknown[];
  userPreferences?: Record<string, unknown>;
  reviewerComments?: string;
}

export interface AgentResult {
  stage: Stage;
  status: "completed" | "awaiting_approval" | "failed";
  output: string;
  changes?: unknown[];
  tokensUsed: number;
  model: string;
  metadata?: Record<string, unknown>;
}

export abstract class BaseAgent {
  abstract stage: Stage;
  abstract model: string;
  
  abstract execute(context: AgentContext): Promise<AgentResult>;

  protected formatOutput(
    output: string, 
    status: AgentResult["status"], 
    tokensUsed: number
  ): AgentResult {
    return {
      stage: this.stage,
      status,
      output,
      tokensUsed,
      model: this.model,
    };
  }
}

/**
 * Reads a previous stage's result. Inside Inngest steps the Map is rebuilt in
 * memory, but after a step replay it may arrive as a plain serialized object.
 */
export function getStageOutput(context: AgentContext, stage: Stage): AgentResult | undefined {
  const outputs = context.previousStageOutputs as Map<Stage, AgentResult> | Partial<Record<Stage, AgentResult>> | undefined;
  if (!outputs) return undefined;
  return outputs instanceof Map ? outputs.get(stage) : outputs[stage];
}
