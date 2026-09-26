import { PublishAIState } from "../state";

export const validateNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const serviceUrl = process.env.VALIDATION_SERVICE_URL || "http://localhost:8000";
  try {
    const response = await fetch(`${serviceUrl}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: state.documentContent || "", action: "academic_text" }),
    });

    if (!response.ok) {
      console.warn(`[validateNode] Validation service returned HTTP ${response.status}`);
      return { validationErrors: [] };
    }

    const result = await response.json();
    
    if (result && !result.is_valid) {
      return { 
        validationErrors: result.errors || ["Document failed external validation."]
      };
    }
    
    return { validationErrors: [] }; 
  } catch (e: any) {
    console.warn("[validateNode] Validation service unreachable:", e);
    // Non-fatal if external microservice is not deployed
    return { validationErrors: [] };
  }
};
