"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isHe = locale === "he";

  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900"
      dir={isHe ? "rtl" : "ltr"}
    >
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">
            {isHe ? "אירעה שגיאה בלתי צפויה" : "Something went wrong"}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {isHe
              ? "המערכת נתקלה בבעיה בעיבוד הבקשה שלך. אנא נסה לרענן את העמוד."
              : "An unexpected error occurred while processing your request. Please try refreshing."}
          </p>
          {error?.message && (
            <p className="text-xs font-mono text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 break-words mt-3 text-left">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isHe ? "נסה שוב" : "Try Again"}</span>
          </button>

          <Link
            href={`/${locale}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{isHe ? "חזרה לדף הבית" : "Dashboard"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
