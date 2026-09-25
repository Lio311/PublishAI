import { PublishAIState } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { Sandbox } from "@e2b/code-interpreter";

export const executionNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  // Use E2B to run Python code for text processing/editing
  let sandbox;
  try {
    sandbox = await Sandbox.create();
    
    // In a real scenario, the LLM would generate the code.
    // We are simulating the execution of an editing script here.
    const code = `
def edit_document(content):
    # Simulated execution
    return content + "\n\n[Edited by ExecutionAgent]"

print(edit_document("""${state.documentContent}"""))
    `;
    
    const execution = await sandbox.commands.run(`python -c '${code.replace(/'/g, "\\'")}'`);
    const newContent = execution.stdout || state.documentContent;
    
    return {
      documentContent: newContent,
      messages: [new AIMessage("Executed document editing via E2B sandbox.")],
    };
  } catch (e) {
    console.error("E2B execution failed", e);
    return {
      messages: [new AIMessage("Execution failed.")],
    };
  } finally {
    if (sandbox) await sandbox.kill();
  }
};
