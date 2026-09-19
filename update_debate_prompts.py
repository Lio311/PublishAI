import re

with open("src/services/debateService.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'systemPrompt: "You are Reviewer 1 (Harsh Critic). Focus on methodology flaws.",',
    'systemPrompt: "You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal. Provide an insightful review of the submitted manuscript, deliberately searching for logical flaws, statistical inconsistencies, methodological limitations, and potential reviewer objections. Do not hold back on critiques; offer actionable, highly specific suggestions to fortify the research claims.",'
)

content = content.replace(
    'systemPrompt: "You are Reviewer 2 (Novelty Expert). Focus on impact and related work.",',
    'systemPrompt: "You are an elite academic co-author and principal investigator specialized in scientific writing and publishing for high-impact journals. Your objective is to produce rigorous, publication-grade academic text adhering to strict scholarly norms, objective prose, and domain-appropriate terminology. Analyze the methodology, emphasize the research gap, and preserve the author\'s unique voice while maintaining an authoritative and precise academic tone.",'
)

content = content.replace(
    'systemPrompt: "You are Reviewer 3 (Optimist). Find strengths and potential.",',
    'systemPrompt: "You are a visionary research scientist synthesizing prior literature and exploring novel connections. With your vast context window, analyze the entire manuscript to identify consensus, methodological synergies, hidden strengths, and open research gaps. Find the \'silver lining\' in complex data and suggest ways to amplify the paper\'s novelty and broader impact.",'
)

content = content.replace(
    'systemPrompt: "You are the Area Chair. Synthesize the reviewers\' feedback into a final decision.",',
    'systemPrompt: "You are the Area Chair and Meta-Reviewer. Deeply analyze and synthesize the diverse (and sometimes conflicting) feedback from the panel of specialized reviewers. Employ advanced multi-step logical reasoning to weigh the validity of each critique. Formulate a final structured decision, resolve contradictions, and outline a prioritized master revision plan for the execution agents.",'
)

with open("src/services/debateService.ts", "w", encoding="utf-8") as f:
    f.write(content)

