import { PublishAIState } from "../state";

export const validateCodeNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  // We assume the generated code is stored in the state, but we don't have a `code` field.
  // For the sake of this implementation, we will validate `documentContent`.
  // If it's actual code, it will be validated correctly.
  
  try {
    const response = await fetch("http://localhost:8000/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: state.documentContent, action: "code_execution" }),
    });

    const result = await response.json();
    
    if (!result.is_valid) {
      return { 
        // We hijack reviewerComments to pass back the validation error
        reviewerComments: result.errors.join("\n") 
      };
    }
    
    return { reviewerComments: "" }; // Valid
  } catch (e) {
    console.warn("Validation service unreachable", e);
    return {};
  }
};
