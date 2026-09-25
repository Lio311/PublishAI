import os

with open("src/services/agents/graph/workflow.ts", "r") as f:
    content = f.read()

# Add imports
imports = """import { retrieveMemoryNode, updateMemoryNode } from "./nodes/memoryNode";
import { guardrailsNode } from "./nodes/guardrailsNode";
"""
content = content.replace('import { coverLetterNode } from "./nodes/coverLetterNode";', 'import { coverLetterNode } from "./nodes/coverLetterNode";\n' + imports)

# Add nodes to builder
nodes = """  .addNode("coverLetterNode", coverLetterNode)
  .addNode("retrieveMemoryNode", retrieveMemoryNode)
  .addNode("updateMemoryNode", updateMemoryNode)
  .addNode("guardrailsNode", guardrailsNode)"""
content = content.replace('.addNode("coverLetterNode", coverLetterNode)', nodes)

# Update edges
# Find edge from scientificReviewNode to draftNode
content = content.replace('.addEdge("scientificReviewNode", "draftNode")', 
                          '.addEdge("scientificReviewNode", "retrieveMemoryNode")\n  .addEdge("retrieveMemoryNode", "draftNode")')

# Find edge from draftNode to editsNode
content = content.replace('.addEdge("draftNode", "editsNode")',
                          '.addEdge("draftNode", "guardrailsNode")\n  .addEdge("guardrailsNode", "editsNode")')

# Find edge from coverLetterNode to END
content = content.replace('.addEdge("coverLetterNode", END)',
                          '.addEdge("coverLetterNode", "updateMemoryNode")\n  .addEdge("updateMemoryNode", END)')

with open("src/services/agents/graph/workflow.ts", "w") as f:
    f.write(content)

