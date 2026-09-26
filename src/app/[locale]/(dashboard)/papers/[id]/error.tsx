"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export default function PaperDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Errors");
  const isHe = locale === "he";

  useEffect(() => {
    console.error("Paper details error boundary caught:", error);
  }, [error]);

  return (
    <div
      className="p-8 max-w-lg mx-auto my-12 bg-white/90 backdrop-blur-md rounded-3xl border border-red-200 shadow-sm text-center space-y-6"
      dir={isHe ? "rtl" : "ltr"}
    >
      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">
          {t("paperError")}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t("paperErrorDesc")}
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
          <span>{t("tryAgain")}</span>
        </button>

        <Link
          href="/papers"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t("backToPapers")}</span>
        </Link>
      </div>
    </div>
  );
}
