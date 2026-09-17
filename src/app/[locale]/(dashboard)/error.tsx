"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isHe = locale === "he";

  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="p-8 my-8 max-w-xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl border border-red-200/80 shadow-sm text-center space-y-5">
      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">
          {isHe ? "שגיאה בטעינת נתוני לוח הבקרה" : "Unable to load dashboard"}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isHe
            ? "חלה בעיה בעת שליפת המידע. אנא נסה לטעון שוב או חזור לדף הראשי."
            : "There was a problem loading this section. Please try again or return to the main dashboard."}
        </p>
        {error?.message && (
          <p className="text-xs font-mono text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 break-words text-left">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isHe ? "טען מחדש" : "Try Again"}</span>
        </button>

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{isHe ? "לוח בקרה" : "Dashboard"}</span>
        </Link>
      </div>
    </div>
  );
}
