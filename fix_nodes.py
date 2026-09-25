import os
import glob

node_files = glob.glob("src/services/agents/graph/nodes/*.ts")

for file in node_files:
    with open(file, "r") as f:
        content = f.read()
    
    # Fix search orchestrator import
    content = content.replace("../../search/search-orchestrator", "@/services/search/search-orchestrator")
    
    # Fix total_tokens type error
    # Instead of response.response_metadata?.tokenUsage?.total_tokens
    # we can cast response_metadata as any
    content = content.replace("response.response_metadata?.tokenUsage?.total_tokens", "(response.response_metadata as any)?.tokenUsage?.total_tokens")
    
    # Sometimes it's response.usage_metadata?.total_tokens
    content = content.replace("response.usage_metadata?.total_tokens", "(response.usage_metadata as any)?.total_tokens")
    
    # If the subagent wrote something else:
    content = content.replace("response.response_metadata?.usage?.total_tokens", "(response.response_metadata as any)?.usage?.total_tokens")
    content = content.replace("response.response_metadata?.total_tokens", "(response.response_metadata as any)?.total_tokens")
    
    with open(file, "w") as f:
        f.write(content)
