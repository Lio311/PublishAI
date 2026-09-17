import React from "react";
import { Award, CheckCircle } from "lucide-react";

export default function ConsensusSummary({ summary }: { summary: string }) {
  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
      <div className="flex items-center gap-2.5 text-emerald-800">
        <div className="p-1.5 bg-emerald-200/60 rounded-lg">
          <Award className="w-5 h-5 text-emerald-700" />
        </div>
        <h3 className="text-base font-bold">Reviewer Consensus Achieved</h3>
      </div>
      <p className="text-sm text-emerald-950 leading-relaxed font-sans bg-white/70 p-4 rounded-xl border border-emerald-100/80">
        {summary}
      </p>
    </div>
  );
}
