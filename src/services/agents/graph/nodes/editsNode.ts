import { PublishAIState } from "../state";

export const editsNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  // If cascade edits already exist, preserve them
  if (state.edits && Array.isArray(state.edits) && state.edits.length > 0) {
    return { edits: state.edits };
  }

  // If guardrails found errors, format them as structured editorial instructions
  if (state.validationErrors && state.validationErrors.length > 0) {
    const guardrailEdits = state.validationErrors.map((err, idx) => ({
      section: `Guardrails Finding #${idx + 1}`,
      instruction: err,
    }));
    return { edits: guardrailEdits };
  }

  return {
    edits: [{ section: "General", instruction: "No editorial revisions required." }],
  };
};
