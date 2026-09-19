with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    line = lines[i]
    out.append(line)
    if "9. Execution Agent" in line:
        # Move forward until we find icon: Save
        while i < len(lines):
            i += 1
            line = lines[i]
            if "icon: Save" in line:
                out.append('    prompt: { \n')
                out.append('      en: "Create a structured summary of the changes made between the original manuscript and the rewritten version.",\n')
                out.append('      he: "צור סיכום מובנה של השינויים שבוצעו בין כתב היד המקורי לגרסה המשוכתבת."\n')
                out.append('    },\n')
                # Replace tools array in this line if missing Claude 3 Opus
                if "Claude 3 Opus" not in line:
                    line = line.replace('tools: ["', 'tools: ["Claude 3 Opus", "')
                out.append(line)
                break
            else:
                out.append(line)
    i += 1

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(out)
