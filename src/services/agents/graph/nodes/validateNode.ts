import { PublishAIState } from "../state";

export const validateNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  try {
    const response = await fetch("http://localhost:8000/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: state.documentContent, action: "academic_text" }),
    });

    const result = await response.json();
    
    if (!result.is_valid) {
      return { 
        validationErrors: result.errors 
      };
    }
    
    return { validationErrors: [] }; 
  } catch (e: any) {
    console.warn("Validation service unreachable", e);
    return { validationErrors: [`Validation service failed: ${e.message}`] };
  }
};
