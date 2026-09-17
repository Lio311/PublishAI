import re

with open("src/components/DocumentEditor.tsx", "r") as f:
    content = f.read()

# Replace imports
new_imports = """
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
"""

content = content.replace('import React, { useState } from "react";', 'import React, { useState, useEffect } from "react";\n' + new_imports)

# Replace textarea with EditorContent
# textarea is approximately:
#             <textarea
#               value={content}
#               onChange={handleContentChange}
#               placeholder="Begin drafting your scientific paper here using markdown..."
#               aria-label="Document Content"
#               className="w-full flex-1 min-h-[500px] text-sm md:text-base leading-relaxed text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none font-mono"
#             />

textarea_pattern = re.compile(r'<textarea[\s\S]*?/>')

editor_init = """
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      setSaveStatus("unsaved");
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none w-full min-h-[500px]',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      // Avoid resetting unnecessarily, but could be useful if initialContent changes
    }
  }, [editor, initialContent]);
"""

# Insert editor_init after const [isAiGenerating, setIsAiGenerating] = useState(false);
content = content.replace('const [isAiGenerating, setIsAiGenerating] = useState(false);', 'const [isAiGenerating, setIsAiGenerating] = useState(false);\n' + editor_init)

# Replace the text area with EditorContent
content = textarea_pattern.sub('<EditorContent editor={editor} className="w-full flex-1" />', content)

# Replace DocumentEditor with RichDocumentEditor
content = content.replace('export default function DocumentEditor', 'export default function RichDocumentEditor')

with open("src/components/RichDocumentEditor.tsx", "w") as f:
    f.write(content)

