import re

with open("src/services/learningService.ts", "r") as f:
    content = f.read()

import_str = 'import { openai } from "@ai-sdk/openai";\n'
content = import_str + content

content = content.replace('model: "gpt-4o-mini", // Fast model for telemetry', 'model: openai("gpt-4o-mini"), // Fast model for telemetry')
content = content.replace('model: "gpt-4o", // Stronger model for parsing complex reviewer comments', 'model: openai("gpt-4o"), // Stronger model for parsing complex reviewer comments')

with open("src/services/learningService.ts", "w") as f:
    f.write(content)
