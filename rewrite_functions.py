import re

with open('src/inngest/functions.ts', 'r') as f:
    content = f.read()

# Replace imports
content = re.sub(
    r'import { AgentOrchestrator } from "@/lib/agents/orchestrator";.*?import { AgentContext, AgentResult, Stage } from "@/lib/agents/base-agent";',
    r'import { publishAiGraph } from "@/lib/agents/graph/workflow";',
    content,
    flags=re.DOTALL
)

# processPaper replacement
# From "const orchestrator = new AgentOrchestrator(step);" down to "// Finalize"
process_paper_start = r'const orchestrator = new AgentOrchestrator\(step\);.*?await step\.run\("update-status-in-progress"'
content = re.sub(process_paper_start, r'await step.run("update-status-in-progress"', content, flags=re.DOTALL)

process_paper_run = r'const context: AgentContext = \{.*?context\.previousStageOutputs\.set\("compilation", compilation\);'
replacement = """await step.run("run-langgraph", async () => {
      return await publishAiGraph.invoke({ paperId: paperId.toString(), manuscriptText: textContent });
    });"""
content = re.sub(process_paper_run, replacement, content, flags=re.DOTALL)


# processResubmission replacement
resub_start = r'const orchestrator = new AgentOrchestrator\(step\);.*?await step\.run\("update-status-resubmission"'
content = re.sub(resub_start, r'await step.run("update-status-resubmission"', content, flags=re.DOTALL)

resub_run = r'const context: AgentContext = \{.*?where\(eq\(paperVersions\.id, versionId\)\);\s*\}'
resub_replacement = """const rebuttalResult: any = await step.run("run-rebuttal-langgraph", async () => {
      return await publishAiGraph.invoke({ paperId: paperId.toString(), manuscriptText: manuscriptText, reviewerComments });
    });

    // Save strategy to DB
    await step.run("save-rebuttal-strategy", async () => {
      if (versionId && rebuttalResult?.rebuttalStrategy) {
        await db.update(paperVersions)
          .set({ rebuttalStrategy: rebuttalResult.rebuttalStrategy })
          .where(eq(paperVersions.id, versionId));
      }"""
content = re.sub(resub_run, resub_replacement, content, flags=re.DOTALL)

with open('src/inngest/functions.ts', 'w') as f:
    f.write(content)

