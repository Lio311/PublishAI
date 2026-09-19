with open('src/app/[locale]/architecture/ArchitectureClient.tsx', 'r') as f:
    content = f.read()

new_content = content.replace('  }\n  "WebSockets": {', '  },\n  "WebSockets": {')

with open('src/app/[locale]/architecture/ArchitectureClient.tsx', 'w') as f:
    f.write(new_content)

print("Fixed comma")
