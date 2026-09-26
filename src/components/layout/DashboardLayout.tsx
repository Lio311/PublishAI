"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { Link, usePathname } from "@/app/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";

import AnimatedSidebar from "./AnimatedSidebar";

export default function DashboardLayout({ 
  children,
  isAdmin = false,
  showSidebar = true
}: { 
  children: React.ReactNode;
  isAdmin?: boolean;
  showSidebar?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className={`min-h-screen flex ${showSidebar ? "flex-col md:flex-row" : "flex-col"} bg-slate-50/50 text-slate-900 font-sans overflow-x-hidden w-full`} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Skip to Main Content Link for Keyboard and Screen Reader Users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:font-medium focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        {t("skipToContent")}
      </a>
      
      {/* Public Top Header (when no sidebar) */}
      {!showSidebar && (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full">
          <div className="flex-1 flex justify-start" />
          
          <Link href="/" aria-label="PublishAI Home" className="flex-1 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg">
             <Image src="/logo.png" alt="PublishAI Logo" width={130} height={40} className="object-contain" priority />
          </Link>
          
          <div className="flex-1 flex justify-end items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-sky-100 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              {t("login")}
            </Link>
          </div>
        </header>
      )}

      {/* Mobile Header (only when there IS a sidebar) */}
      {showSidebar && (
        <header className="md:hidden relative flex items-center justify-center p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] shadow-sm w-full h-[72px]">
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t("openMenu")}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-sidebar"
            className="absolute start-4 p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <Link href="/" aria-label="PublishAI Home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg">
            <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
          </Link>
        </header>
      )}

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[65] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      {showSidebar && (
        <div 
          id="mobile-sidebar"
          className={`
            fixed inset-y-0 h-full md:sticky md:top-0 md:flex z-[70] md:z-50 md:h-screen py-0 md:py-0
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen 
              ? 'translate-x-0 visible' 
              : (locale === 'he' ? 'translate-x-full md:translate-x-0 max-md:invisible max-md:pointer-events-none' : '-translate-x-full md:translate-x-0 max-md:invisible max-md:pointer-events-none')}
            ${locale === 'he' ? 'right-0' : 'left-0'}
          `}
        >
          <AnimatedSidebar isAdmin={isAdmin} onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto relative bg-slate-50/30 flex flex-col w-full max-w-[100vw] focus:outline-none">
        {/* Subtle page background glows (Mesh Gradient effect) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        
        <div className={`relative z-10 w-full ${showSidebar ? 'p-4 md:p-8 max-w-6xl mx-auto' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
