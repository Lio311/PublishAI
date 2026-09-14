"use client";

import { useState } from "react";
import { Shield, Lock, Trash2, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface SecurityBriefingProps {
  onAccept: () => void;
  onCancel: () => void;
}

export function SecurityBriefing({ onAccept, onCancel }: SecurityBriefingProps) {
  const [accepted, setAccepted] = useState(false);
  const t = useTranslations("submission.security");
  const locale = useLocale();
  const isHe = locale === "he";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <Shield className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">{t("title")}</h2>
      </div>
      
      <div className="p-6 space-y-6 text-slate-600">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Info className="w-5 h-5 text-blue-500" />
            <h3>{t("whyCredentials")}</h3>
          </div>
          <p className="text-sm pl-7">{t("whyCredentialsDesc")}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h3>{t("howProtected")}</h3>
          </div>
          <ul className="text-sm space-y-2 pl-7">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{t("encryption")}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{t("neverPlaintext")}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{t("deleteAnytime")}</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-semibold text-blue-900 block mb-1">{isHe ? "סיסמאות יישום (Application Passwords) בוורדפרס" : "WordPress Application Passwords"}</span>
            <p className="text-blue-800">
              {isHe ? "עבור אתרי WordPress, מומלץ ליצור Application Password ייעודי במקום להשתמש בסיסמה הראשית שלך. ניתן למצוא זאת תחת Users → Profile." : "For WordPress sites, it is recommended to create a dedicated Application Password instead of using your main password. You can find this under Users → Profile."}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
              {t("consent")}
            </span>
          </label>
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors"
        >
          {t("cancel")}
        </button>
        <button 
          onClick={onAccept}
          disabled={!accepted}
          className="px-6 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-blue-500 hover:via-sky-500 hover:to-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
