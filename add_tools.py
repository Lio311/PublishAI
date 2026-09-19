import re

with open('src/app/[locale]/architecture/ArchitectureClient.tsx', 'r') as f:
    content = f.read()

# Add WebSockets to TOOLS_INFO
websocket_entry = """  "WebSockets": {
    en: "Real-time bi-directional communication protocol used to stream live screenshots and receive instant user interventions during RPA roadblocks.",
    he: "פרוטוקול תקשורת דו-כיווני בזמן אמת המשמש להזרמת צילומי מסך חיים וקבלת התערבות מיידית מהמשתמש בעת חסימות בתהליך ה-RPA."
  },
"""

tools_end_index = content.find('};\n\nconst PHASES =')
if tools_end_index == -1:
    print("Could not find TOOLS_INFO end")
    exit(1)

new_content = content[:tools_end_index] + websocket_entry + content[tools_end_index:]

with open('src/app/[locale]/architecture/ArchitectureClient.tsx', 'w') as f:
    f.write(new_content)

print("Added tools")
