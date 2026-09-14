export type Stage = 
  | "clarification" 
  | "planning" 
  | "knowledge" 
  | "scientific_review" 
  | "writing" 
  | "execution" 
  | "qa" 
  | "verification" 
  | "compilation";

export interface AgentContext {
  paperId: string;
  manuscriptText: string;
  manuscriptStructure?: any; // To be typed later
  journalRules?: any;
  previousStageOutputs: Map<Stage, AgentResult>;
  references?: any[];
  userPreferences?: any;
}

export interface AgentResult {
  stage: Stage;
  status: "success" | "needs_approval" | "failed";
  output: string;
  changes?: any[];
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
