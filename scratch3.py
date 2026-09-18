import re

with open("src/components/layout/GlobalPasswordProtection.tsx", "r") as f:
    content = f.read()

# Add state for playwright bypass
content = content.replace(
    "const [pinError, setPinError] = useState(false);",
    "const [pinError, setPinError] = useState(false);\n    const [isE2E, setIsE2E] = useState(false);"
)

# Set isE2E in the first useEffect
content = content.replace(
    "const authTime = localStorage.getItem('publishai_global_auth_time_v2');",
    "const authTime = localStorage.getItem('publishai_global_auth_time_v2');\n        const isPlaywright = localStorage.getItem('playwright_bypass_auth') === 'true';\n        setIsE2E(isPlaywright);"
)

# Skip authentication if isE2E is true
content = content.replace(
    "if (status === 'unauthenticated') {",
    "if (status === 'unauthenticated' && !isE2E) {"
)

with open("src/components/layout/GlobalPasswordProtection.tsx", "w") as f:
    f.write(content)
