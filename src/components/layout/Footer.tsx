"use client";

import { useTranslations } from "next-intl";

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
      </div>
    </footer>
  );
}
