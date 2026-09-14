"use client";

import { useTranslations } from "next-intl";

interface DiffEditorProps {
  originalText: string;
  modifiedText: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffEditor({ originalText, modifiedText, onAccept, onReject }: DiffEditorProps) {
  const t = useTranslations("Dashboard.diff");
  // In a real application, we would use a library like `diff` or `react-diff-viewer`.
  // For this MVP, we present a side-by-side comparison.

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-800">Track Changes</h3>
        <div className="flex gap-2">
          <button 
            onClick={onReject}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Reject Changes
          </button>
          <button 
            onClick={onAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 rounded-lg hover:from-blue-500 hover:via-sky-500 hover:to-sky-400"
          >
            Accept Changes
          </button>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-2 divide-x divide-slate-200 overflow-hidden">
        <div className="p-6 overflow-y-auto bg-red-50/30">
          <h4 className="text-sm font-medium text-red-800 mb-4 uppercase tracking-wider">Original</h4>
          <div className="text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
            {originalText || "No original text available."}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto bg-green-50/30">
          <h4 className="text-sm font-medium text-green-800 mb-4 uppercase tracking-wider">AI Revision</h4>
          <div className="text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
            {modifiedText || "No revisions available yet."}
          </div>
        </div>
      </div>
    </div>
  );
}
