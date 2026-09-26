"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/app/i18n/routing";
import { Sparkles, Shield, Share2, Workflow } from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      role="contentinfo" 
      aria-label={t("footerAriaLabel")}
      className="mt-auto border-t border-slate-200/80 bg-white/60 backdrop-blur-md text-slate-500 py-6 px-4 md:px-8 transition-colors"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand & Description */}
        <div className="flex items-center gap-2 text-center sm:text-start">
          <div className="p-1 rounded-md bg-sky-100/70 text-sky-600">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-semibold text-slate-700">{t("systemName")}</span>
            <span className="mx-2 text-slate-300" aria-hidden="true">|</span>
            <span className="text-slate-500 hidden md:inline">{t("description")}</span>
            <span className="text-slate-400 block md:inline md:ms-2">
              © {currentYear} {t("allRightsReserved")}
            </span>
          </div>
        </div>

        {/* Links */}
        <nav 
          aria-label={t("footerNavAriaLabel")}
          className="flex items-center gap-4 text-slate-600 flex-wrap justify-center"
        >
          <ul role="list" className="flex items-center gap-4 flex-wrap justify-center">
            <li>
              <Link 
                href="/architecture" 
                className="hover:text-sky-600 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded px-1"
              >
                <Share2 className="w-3 h-3" aria-hidden="true" />
                <span>{t("architecture")}</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/flowchart" 
                className="hover:text-sky-600 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded px-1"
              >
                <Workflow className="w-3 h-3" aria-hidden="true" />
                <span>{t("flowchart")}</span>
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">•</li>
            <li className="text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span>{t("privacy")}</span>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
