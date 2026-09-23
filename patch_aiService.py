import re

with open("src/services/ai/aiService.ts", "r") as f:
    content = f.read()

import_str = 'import { getApplicableRules, extractUserRewriteFeedback } from "@/services/learningService";\n'

# Find the last import and add our import
last_import_idx = content.rfind("import ")
end_of_last_import = content.find("\n", last_import_idx) + 1
content = content[:end_of_last_import] + import_str + content[end_of_last_import:]

# Modify refineAcademicWriting
old_func = """export async function refineAcademicWriting(options: RefineWritingOptions): Promise<AIResponse> {
  const instructionsByMode: Record<RefineWritingOptions["mode"], string> = {
    academic_tone: "Elevate the prose to formal academic English, replacing colloquialisms with rigorous scientific terminology while avoiding unnecessary verbosity.",
    clarity: "Improve readability, eliminate ambiguities, and ensure the logical flow and reasoning are immediately transparent to peer reviewers.",
    conciseness: "Tighten phrasing, remove redundancy, and shorten the text while preserving 100% of the scientific content, claims, and data points.",
    formalize: "Transform informal or rough drafting notes into structured, elegant scholarly manuscript text.",
    expand: "Elaborate thoroughly on the underlying mechanisms, methodology, implications, and scholarly nuance without padding or fluff.",
    fix_grammar: "Correct all grammatical, orthographical, punctuational, and syntax errors with zero alteration to intended meaning.",
  };

  const systemPrompt = `You are an expert scientific editor for leading academic journals.
Task: ${instructionsByMode[options.mode] || instructionsByMode.academic_tone}
Ensure scientific accuracy, preserve author citations and specific numbers/metrics, and adhere to publication standards.`;

  let prompt = `Original Text:\n\"\"\"\n${options.text}\n\"\"\"\n\nGoal: ${options.mode}`;
  if (options.feedback) {
    prompt += `\nSpecific Revision Feedback: ${options.feedback}`;
  }
  if (options.guidelines) {
    prompt += `\nStylistic Guidelines: ${options.guidelines}`;
  }
  prompt += `\n\nProvide the refined academic text below:`;

  return callLLM({
    prompt,
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    apiKey: options.apiKey,
    temperature: 0.2,
  });
}"""

new_func = """export async function refineAcademicWriting(options: RefineWritingOptions): Promise<AIResponse> {
  const instructionsByMode: Record<RefineWritingOptions["mode"], string> = {
    academic_tone: "Elevate the prose to formal academic English, replacing colloquialisms with rigorous scientific terminology while avoiding unnecessary verbosity.",
    clarity: "Improve readability, eliminate ambiguities, and ensure the logical flow and reasoning are immediately transparent to peer reviewers.",
    conciseness: "Tighten phrasing, remove redundancy, and shorten the text while preserving 100% of the scientific content, claims, and data points.",
    formalize: "Transform informal or rough drafting notes into structured, elegant scholarly manuscript text.",
    expand: "Elaborate thoroughly on the underlying mechanisms, methodology, implications, and scholarly nuance without padding or fluff.",
    fix_grammar: "Correct all grammatical, orthographical, punctuational, and syntax errors with zero alteration to intended meaning.",
  };

  let systemPrompt = `You are an expert scientific editor for leading academic journals.
Task: ${instructionsByMode[options.mode] || instructionsByMode.academic_tone}
Ensure scientific accuracy, preserve author citations and specific numbers/metrics, and adhere to publication standards.`;

  // Inject learned rules
  const applicableRules = await getApplicableRules(options.userId, options.journalId);
  if (applicableRules) {
    systemPrompt += `\n\nIMPORTANT WRITING PREFERENCES (Learned from User & Reviewers):\n${applicableRules}`;
  }

  let prompt = `Original Text:\n\"\"\"\n${options.text}\n\"\"\"\n\nGoal: ${options.mode}`;
  if (options.feedback) {
    prompt += `\nSpecific Revision Feedback: ${options.feedback}`;
    
    // Asynchronously extract telemetry/rules from user feedback for future learning
    if (options.userId) {
      extractUserRewriteFeedback(
        options.userId,
        options.text,
        options.feedback,
        options.mode,
        options.journalId
      ).catch(err => console.error("Background learning task failed:", err));
    }
  }
  if (options.guidelines) {
    prompt += `\nStylistic Guidelines: ${options.guidelines}`;
  }
  prompt += `\n\nProvide the refined academic text below:`;

  return callLLM({
    prompt,
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    apiKey: options.apiKey,
    temperature: 0.2,
  });
}"""

content = content.replace(old_func, new_func)

with open("src/services/ai/aiService.ts", "w") as f:
    f.write(content)
