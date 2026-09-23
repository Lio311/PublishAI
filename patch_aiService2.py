with open("src/services/ai/aiService.ts", "r") as f:
    content = f.read()

bad_string = "import {\nimport { getApplicableRules, extractUserRewriteFeedback } from \"@/services/learningService\";"
fixed_string = "import { getApplicableRules, extractUserRewriteFeedback } from \"@/services/learningService\";\nimport {"

content = content.replace(bad_string, fixed_string)

with open("src/services/ai/aiService.ts", "w") as f:
    f.write(content)
