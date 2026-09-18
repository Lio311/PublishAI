import re

with open("e2e/submissions.spec.ts", "r") as f:
    content = f.read()

content = content.replace(
    "window.localStorage.setItem('publishai_global_auth_time_v2', Date.now().toString());",
    "window.localStorage.setItem('publishai_global_auth_time_v2', Date.now().toString());\n      window.localStorage.setItem('playwright_bypass_auth', 'true');"
)

with open("e2e/submissions.spec.ts", "w") as f:
    f.write(content)
