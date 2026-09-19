import re

with open("src/services/debateService.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the reviewerPrompts array to include system strings
content = content.replace(
    '''  const reviewerPrompts = [
    { name: "Reviewer 1", prompt: "Evaluate the methodology. Paper: " + paperText, model: openai("gpt-4o") },
    { name: "Reviewer 2", prompt: "Evaluate the novelty. Paper: " + paperText, model: anthropic("claude-3-5-sonnet-20240620") },
    { name: "Reviewer 3", prompt: "Evaluate the strengths. Paper: " + paperText, model: google("models/gemini-1.5-pro-latest") },
  ];''',
    '''  const reviewerPrompts = [
    { 
      name: "Reviewer 1", 
      system: "You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal. Provide an insightful review of the submitted manuscript, deliberately searching for logical flaws, statistical inconsistencies, methodological limitations, and potential reviewer objections. Do not hold back on critiques; offer actionable, highly specific suggestions to fortify the research claims.",
      prompt: "Evaluate the methodology and provide critical feedback on the following manuscript:\\n\\n" + paperText, 
      model: openai("gpt-4o") 
    },
    { 
      name: "Reviewer 2", 
      system: "You are an elite academic co-author and principal investigator specialized in scientific writing and publishing for high-impact journals. Your objective is to produce rigorous, publication-grade academic text adhering to strict scholarly norms, objective prose, and domain-appropriate terminology. Analyze the methodology, emphasize the research gap, and preserve the author's unique voice while maintaining an authoritative and precise academic tone.",
      prompt: "Evaluate the novelty, related work, and overall impact of the following manuscript:\\n\\n" + paperText, 
      model: anthropic("claude-3-5-sonnet-20240620") 
    },
    { 
      name: "Reviewer 3", 
      system: "You are a visionary research scientist synthesizing prior literature and exploring novel connections. With your vast context window, analyze the entire manuscript to identify consensus, methodological synergies, hidden strengths, and open research gaps. Find the 'silver lining' in complex data and suggest ways to amplify the paper's novelty and broader impact.",
      prompt: "Evaluate the hidden strengths, potential synergies, and novel connections within the following manuscript:\\n\\n" + paperText, 
      model: google("models/gemini-1.5-pro-latest") 
    },
  ];'''
)

# Pass system to generateText for reviewers
content = content.replace(
    '''      const { text } = await generateText({
        model: rev.model,
        prompt: rev.prompt,
      });''',
    '''      const { text } = await generateText({
        model: rev.model,
        system: rev.system,
        prompt: rev.prompt,
      });'''
)

# Add system to Area Chair
content = content.replace(
    '''  const { text: areaChairDecision } = await generateText({
    model: openai("o1-preview"),
    prompt: chairPrompt,
  });''',
    '''  const { text: areaChairDecision } = await generateText({
    model: openai("o1-preview"),
    prompt: "System Context:\\nYou are the Area Chair and Meta-Reviewer. Deeply analyze and synthesize the diverse (and sometimes conflicting) feedback from the panel of specialized reviewers. Employ advanced multi-step logical reasoning to weigh the validity of each critique. Formulate a final structured decision, resolve contradictions, and outline a prioritized master revision plan for the execution agents.\\n\\n" + chairPrompt,
  });'''
)
# Note: o1-preview does not support the 'system' parameter in Vercel AI SDK directly currently in standard ways without developer messages, or putting it in the user prompt is safer. So I prepended it to the prompt.

with open("src/services/debateService.ts", "w", encoding="utf-8") as f:
    f.write(content)

