"use client";

import { MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useLocale } from "next-intl";

export type ReviewItem = {
  id: string;
  type: "critical" | "suggestion" | "positive";
  section: string;
  comment: string;
};

interface ReviewPanelProps {
  reviews: ReviewItem[];
}

export function ReviewPanel({ reviews }: ReviewPanelProps) {
  const locale = useLocale();
  const isHe = locale === "he";
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-800">{isHe ? "סימולטור ביקורת עמיתים" : "Peer Review Simulator"}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p>{isHe ? "טרם נוצרו ביקורות." : "No reviews generated yet."}</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div 
              key={review.id} 
              className={`p-4 rounded-lg border ${
                review.type === 'critical' ? 'bg-red-50 border-red-100' :
                review.type === 'suggestion' ? 'bg-amber-50 border-amber-100' :
                'bg-emerald-50 border-emerald-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {review.type === 'critical' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                {review.type === 'suggestion' && <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                {review.type === 'positive' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    review.type === 'critical' ? 'text-red-700' :
                    review.type === 'suggestion' ? 'text-amber-700' :
                    'text-emerald-700'
                  }`}>
                    {review.section}
                  </span>
                  <p className="mt-1 text-sm text-slate-800">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
