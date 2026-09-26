"use client";

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Insertion, Deletion } from './extensions/TrackChanges';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react';

export interface AITiptapEditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  onSave?: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  autosaveInterval?: number;
}

export default function AITiptapEditor({
  initialContent = "",
  onUpdate,
  onSave,
  className = "",
  readOnly = false,
  autosaveInterval = 3000,
}: AITiptapEditorProps) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Insertion,
      Deletion,
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      if (!isMountedRef.current) return;
      const html = ed.getHTML();
      onUpdate?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-base focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // State synchronization: sync editor content if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentHtml = editor.getHTML();
      if (initialContent !== currentHtml) {
        editor.commands.setContent(initialContent, { emitUpdate: false });
      }
    }
  }, [editor, initialContent]);

  // Synchronize readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Debounced autosave with cleanup
  useEffect(() => {
    if (!editor || !onSave || autosaveInterval <= 0) return;

    const timer = setTimeout(() => {
      if (isMountedRef.current && editor) {
        try {
          onSave(editor.getHTML());
        } catch (err) {
          console.error("[AITiptapEditor] Autosave error:", err);
        }
      }
    }, autosaveInterval);

    return () => {
      clearTimeout(timer);
    };
  }, [editor?.getHTML(), onSave, autosaveInterval]);

  return (
    <div
      data-testid="tiptap-editor"
      className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs ${className}`}
    >
      {!readOnly && (
        <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-50 flex items-center gap-1 text-slate-600 text-xs">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('bold') ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('italic') ? 'bg-slate-200 text-slate-900' : ''
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : ''
            }`}
            title="Ordered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : ''
            }`}
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            className={`p-1 rounded hover:bg-slate-200 cursor-pointer ${
              editor?.isActive('codeBlock') ? 'bg-slate-200 text-slate-900' : ''
            }`}
            title="Code Block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
