import { BaseAgent, AgentContext, AgentResult } from "./base-agent";
import { askClaude, ClaudeModel } from "./claude-client";

const CONTENT_MAPPINGS: Record<string, string> = {
  "significance-and-fit": "Explain why these findings represent a substantial breakthrough and are of immediate interest to [journal] readership",
  "originality-statement": "Confirm the work is original, not published elsewhere, not under consideration by another journal",
  "co-author-approval": "Confirm all listed authors have read and approved the manuscript",
  "related-work-disclosure": "Disclose any related manuscripts under consideration, in press, or published elsewhere (including preprints)",
  "reviewer-suggestions": "Suggest potential reviewers with name, institution, and email",
  "reviewer-exclusions": "List any reviewers to exclude with scientific rationale",
  "colleague-review-disclosure": "List colleagues who reviewed the draft before submission",
  "conference-extension-disclosure": "If extending a conference paper, detail the ≥30% new technical content",
  "translational-bridge": "Explain how basic research connects to human disease, clinical diagnosis, or patient management",
  "clinical-significance-worldwide": "Explain clinical significance for worldwide general medical readership",
  "why-lancet-not-specialty": "Explain why this fits [journal] rather than a specialty journal",
  "clinical-impact-pitch": "Concise pitch explaining clinical impact for general medical practitioners",
  "trial-registration": "Provide clinical trial registration details (registry name and identifier)",
  "key-findings-identification": "Identify pivotal data, figures, or experiments that support conclusions",
  "prior-editorial-contact": "Disclose any prior discussions with editors regarding this study",
  "discovery-elevator-pitch": "Concise elevator pitch of the fundamental biological discovery",
  "conceptual-advance-justification": "Explain why this represents an exceptional conceptual advance",
  "scope-justification-edics": "Explain why this is the appropriate venue, specify EDICS category",
  "reviewer-nominations": "Recommend preferred reviewers with email and affiliation, and non-preferred with justification",
  "conflicts-of-interest": "Disclose any financial, institutional, or personal conflicts of interest",
  "multidisciplinary-significance": "Explain broad multidisciplinary significance and novelty",
  "major-minor-category": "Declare scientific classification: Major Category and Minor Category",
  "article-type-identification": "Identify the specific article type",
  "academic-editor-suggestions": "Suggest appropriate Academic Editors from the editorial board",
  "financial-disclosures": "Disclose any financial interests or potential conflicts",
  "importance-to-bmj-readership": "Explain why important and relevant to BMJ international readership",
  "clinical-practice-policy-relevance": "Explain how study influences clinical practice, health policy, or public health",
  "core-question-and-findings": "Concise explanation of core scientific question and primary findings",
  "why-nature-medicine": "Justify why this warrants Nature Medicine's broad audience instead of a specialized journal"
};

const TONE_MAPPINGS: Record<string, string> = {
  "broad-scientific-impact": "Write for a general scientific audience; emphasize breakthrough significance and cross-disciplinary relevance",
  "cross-disciplinary-significance": "Emphasize why findings matter beyond the specific field",
  "clinical-impact": "Focus on clinical practice implications, patient outcomes, and public health relevance",
  "clinical-practice-policy": "Focus on clinical practice changes and health policy implications",
  "translational-medicine": "Bridge basic science to clinical applications; emphasize disease relevance",
  "fundamental-biological-discovery": "Emphasize mechanistic completeness and biological novelty",
  "technical-scope-justification": "Focus on technical contribution and fit within the journal's scope",
  "methodological-rigor": "Emphasize methodology soundness and reproducibility",
  "multidisciplinary-significance": "Show broad relevance across scientific disciplines"
};

export class CoverLetterAgent extends BaseAgent {
  stage = "cover_letter" as const; // Assuming it runs during compilation
  model: ClaudeModel = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const journalName = String((context.journalRules as any)?.name || "the target journal");
    const rules = (context.journalRules as any)?.coverLetterRules;
    
    let prompt = `You are an academic editor. Write a professional cover letter for the following manuscript being submitted to the journal "${journalName}".\n\n`;
    prompt += `Here is the manuscript abstract/intro to base it on:\n${context.manuscriptText.substring(0, 2000)}\n\n`;

    if (rules) {
      if (rules.templatePrompt) {
        prompt += `Please follow this specific template/prompt exactly:\n${rules.templatePrompt}\n\n`;
      }

      if (rules.toneGuidance) {
        const tone = TONE_MAPPINGS[rules.toneGuidance] || rules.toneGuidance;
        prompt += `Tone Guidance: ${tone}.\n\n`;
      }

      if (rules.requiredContent && Array.isArray(rules.requiredContent) && rules.requiredContent.length > 0) {
        prompt += `The cover letter MUST include the following required elements:\n`;
        rules.requiredContent.forEach((key: string, index: number) => {
          let description = CONTENT_MAPPINGS[key] || key;
          description = description.replace(/\[journal\]/g, journalName);
          prompt += `${index + 1}. ${description}\n`;
        });
        prompt += `\n`;
      } else {
        prompt += `Ensure it follows this structure:
1. Address the Editor in Chief.
2. State the title of the manuscript and intent to submit.
3. Briefly highlight the main findings and significance (why it fits the journal).
4. Confirm it has not been published elsewhere.
5. Provide contact info.\n\n`;
      }

      if (rules.uniqueRequirements) {
        prompt += `Additionally, you MUST adhere to these unique journal requirements verbatim:\n${rules.uniqueRequirements}\n\n`;
      }
    } else {
      // Fallback to generic structure
      prompt += `Ensure it follows this structure:
1. Address the Editor in Chief.
2. State the title of the manuscript and intent to submit.
3. Briefly highlight the main findings and significance (why it fits the journal).
4. Confirm it has not been published elsewhere.
5. Provide contact info.`;
    }

    const { text, tokensUsed } = await askClaude(prompt, this.model);
    
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
