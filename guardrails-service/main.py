from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from guardrails import Guard
from validators import SafeCodeExecution, NoAIApologies, NoUnresolvedPlaceholders

app = FastAPI()

safe_code_guard = Guard().use(SafeCodeExecution, on_fail="exception")
academic_text_guard = Guard().use(NoAIApologies, on_fail="exception").use(NoUnresolvedPlaceholders, on_fail="exception")

class ValidationRequest(BaseModel):
    content: str
    action: str = "code_execution" # Can be 'code_execution' or 'academic_text'

class ValidationResponse(BaseModel):
    is_valid: bool
    validated_text: str | None = None
    errors: list[str] = []

@app.post("/validate", response_model=ValidationResponse)
async def validate_content(req: ValidationRequest):
    try:
        if req.action == "code_execution":
            result = safe_code_guard.validate(req.content)
        elif req.action == "academic_text":
            result = academic_text_guard.validate(req.content)
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        if result.validation_passed:
             return ValidationResponse(is_valid=True, validated_text=result.validated_output)
        else:
             return ValidationResponse(is_valid=False, errors=["Validation failed. See logs."])

    except Exception as e:
        return ValidationResponse(is_valid=False, errors=[str(e)])
