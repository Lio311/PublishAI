"use client";

import React from "react";
import { FileQuestion, Home } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export default function NotFound() {
  const locale = useLocale() || "en";
  const t = useTranslations("Errors");
  const isHe = locale === "he";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900"
      dir={isHe ? "rtl" : "ltr"}
    >
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">404</h2>
          <h3 className="text-lg font-semibold text-slate-700">
            {t("pageNotFound")}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {t("pageNotFoundDesc")}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t("home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
