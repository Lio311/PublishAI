import { PublishAIState } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { Sandbox } from "@e2b/code-interpreter";

export const executionNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  // Use E2B to run Python code for text processing/editing
  let sandbox;
  try {
    sandbox = await Sandbox.create();
    
    // Safely encode content in base64 to avoid quote escaping and syntax errors
    const encodedContent = Buffer.from(state.documentContent || "").toString("base64");
    const script = `
import base64
content = base64.b64decode("${encodedContent}").decode("utf-8")

def edit_document(text):
    return text + "\\n\\n[Edited by ExecutionAgent]"

print(edit_document(content))
`;
    
    const execution = await sandbox.commands.run(`python -c '${script.replace(/'/g, "\\'")}'`);
    const newContent = execution.stdout ? execution.stdout.trim() : (state.documentContent || "");
    
    return {
      documentContent: newContent,
      messages: [new AIMessage("Executed document editing via E2B sandbox.")],
      currentStage: "execution"
    };
  } catch (e) {
    console.error("[executionNode] E2B execution failed:", e);
    return {
      messages: [new AIMessage(`Execution stage error: ${e instanceof Error ? e.message : String(e)}`)],
      currentStage: "execution"
    };
  } finally {
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (killErr) {
        console.warn("[executionNode] Failed to kill sandbox:", killErr);
      }
    }
  }
};
