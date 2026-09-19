import re

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the state initialization block
old_state = "  const [selectedTool, setSelectedTool] = useState<string | null>(null);"

new_state = """  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/${locale}/architecture`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };"""

content = content.replace(old_state, new_state)

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

