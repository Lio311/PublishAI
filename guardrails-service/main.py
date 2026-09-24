from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from guardrails import Guard
from validators import SafeCodeExecution

app = FastAPI()

safe_code_guard = Guard().use(SafeCodeExecution, on_fail="exception")

class ValidationRequest(BaseModel):
    content: str
    action: str = "code_execution"

class ValidationResponse(BaseModel):
    is_valid: bool
    validated_text: str | None = None
    errors: list[str] = []

@app.post("/validate", response_model=ValidationResponse)
async def validate_content(req: ValidationRequest):
    try:
        if req.action == "code_execution":
            result = safe_code_guard.validate(req.content)
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        if result.validation_passed:
             return ValidationResponse(is_valid=True, validated_text=result.validated_output)
        else:
             return ValidationResponse(is_valid=False, errors=["Validation failed. See logs."])

    except Exception as e:
        return ValidationResponse(is_valid=False, errors=[str(e)])
