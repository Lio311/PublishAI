"use client";

import { CheckCircle2, AlertTriangle, FileText } from "lucide-react";

interface ReviewPanelProps {
  title: string;
  content: string;
  type?: "review" | "warning" | "success";
}

export default function ReviewPanel({ title, content, type = "review" }: ReviewPanelProps) {
  const bgColor = type === "warning" ? "bg-amber-50" : type === "success" ? "bg-emerald-50" : "bg-sky-50";
  const iconColor = type === "warning" ? "text-amber-600" : type === "success" ? "text-emerald-600" : "text-sky-500";
  const Icon = type === "warning" ? AlertTriangle : type === "success" ? CheckCircle2 : FileText;

  return (
    <div className={`p-6 rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] backdrop-blur-md ${bgColor}/70`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-white shadow-sm ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          <div className="text-slate-700 prose prose-sm max-w-none whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
