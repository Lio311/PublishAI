import ast
from guardrails.validators import Validator, register_validator, ValidationResult, Pass, Fail

@register_validator(name="safe_code_execution", data_type="string")
class SafeCodeExecution(Validator):
    def validate(self, value: str, metadata: dict) -> ValidationResult:
        try:
            tree = ast.parse(value)
        except SyntaxError:
            return Fail(error_message="Code contains syntax errors.")

        for node in ast.walk(tree):
            if isinstance(node, ast.While):
                if isinstance(node.test, ast.Constant) and node.test.value is True:
                    return Fail(error_message="Infinite loop detected (while True).")
            
            if isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                names = node.names if isinstance(node, ast.Import) else node.names
                for alias in names:
                    if alias.name in ["os", "subprocess", "shutil", "sys"]:
                        return Fail(error_message=f"Potentially destructive import blocked: {alias.name}")

            if isinstance(node, ast.Call):
                if hasattr(node.func, "id") and node.func.id in ["eval", "exec", "open"]:
                    return Fail(error_message=f"Dangerous function call blocked: {node.func.id}")

        return Pass()

import re

@register_validator(name="no_ai_apologies", data_type="string")
class NoAIApologies(Validator):
    def validate(self, value: str, metadata: dict) -> ValidationResult:
        apologies = [
            "as an ai", 
            "as a language model", 
            "i am an ai", 
            "i'm sorry, but",
            "i apologize"
        ]
        lower_value = value.lower()
        for phrase in apologies:
            if phrase in lower_value:
                return Fail(error_message=f"AI apology or persona leakage detected: '{phrase}'")
        return Pass()

@register_validator(name="no_unresolved_placeholders", data_type="string")
class NoUnresolvedPlaceholders(Validator):
    def validate(self, value: str, metadata: dict) -> ValidationResult:
        pattern = r'\[.*?\]'
        matches = re.findall(pattern, value)
        bad_placeholders = [m for m in matches if any(word in m.lower() for word in ['insert', 'citation', 'author', 'year', 'todo', 'tbd'])]
        if bad_placeholders:
            return Fail(error_message=f"Unresolved placeholders detected: {bad_placeholders}")
        return Pass()
