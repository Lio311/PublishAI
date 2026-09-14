"use client";

import { DiffEditor as MonacoDiffEditor } from "@monaco-editor/react";
import { Check, X } from "lucide-react";

interface DiffEditorProps {
  original: string;
  modified: string;
  onAccept?: () => void;
  onReject?: () => void;
}

export function DiffEditor({ original, modified, onAccept, onReject }: DiffEditorProps) {
  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Track Changes (Diff)</h3>
        <div className="flex items-center gap-2">
          {onReject && (
            <button 
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              <X className="w-4 h-4 text-red-500" />
              Reject All
            </button>
          )}
          {onAccept && (
            <button 
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 rounded-md hover:from-blue-500 hover:via-sky-500 hover:to-sky-400"
            >
              <Check className="w-4 h-4" />
              Accept Changes
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-[400px]">
        <MonacoDiffEditor
          height="100%"
          language="markdown"
          original={original}
          modified={modified}
          options={{
            renderSideBySide: true,
            readOnly: true,
            minimap: { enabled: false },
            wordWrap: "on",
            lineNumbers: "off"
          }}
        />
      </div>
    </div>
  );
}
