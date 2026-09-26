"use client";

import { Menu, Globe, LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/app/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

import AnimatedSidebar from "./AnimatedSidebar";
import Footer from "./Footer";

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
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const nextLocale = locale === 'he' ? 'en' : 'he';
    router.replace(pathname, { locale: nextLocale });
  };

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

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
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
          <div className="flex-1 flex justify-start items-center">
            {/* Language Switcher for public/top header */}
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={t("switchLanguage")}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'he' ? 'English' : 'עברית'}</span>
            </button>
          </div>
          
          <Link href="/" aria-label="PublishAI Home" className="flex-1 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg">
             <Image src="/logo.png" alt="PublishAI Logo" width={130} height={40} className="object-contain" priority />
          </Link>
          
          <div className="flex-1 flex justify-end items-center gap-3">
            {mounted && session ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 truncate max-w-[160px]">
                  <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span className="truncate">{session.user?.name || session.user?.email}</span>
                </span>
                <button 
                  type="button"
                  onClick={() => signOut()}
                  aria-label={t("logout")}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full border border-red-100 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => signIn()}
                aria-label={t("login")}
                className="text-xs md:text-sm font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-sky-100 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {t("login")}
              </button>
            )}
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
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[65] md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      {showSidebar && (
        <div 
          id="mobile-sidebar"
          role={isMobileMenuOpen ? "dialog" : undefined}
          aria-modal={isMobileMenuOpen ? "true" : undefined}
          aria-label={isMobileMenuOpen ? t("navigation") : undefined}
          aria-hidden={!isMobileMenuOpen ? "true" : undefined}
          className={`
            fixed inset-y-0 h-full md:sticky md:top-0 md:flex z-[70] md:z-50 md:h-screen py-0 md:py-0
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen 
              ? 'translate-x-0 pointer-events-auto' 
              : (locale === 'he' ? 'translate-x-full md:translate-x-0 md:pointer-events-auto pointer-events-none' : '-translate-x-full md:translate-x-0 md:pointer-events-auto pointer-events-none')}
            ${locale === 'he' ? 'right-0' : 'left-0'}
            md:right-auto md:left-auto
          `}
        >
          <AnimatedSidebar isAdmin={isAdmin} onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main 
        id="main-content" 
        tabIndex={-1} 
        className="flex-1 min-w-0 overflow-auto relative bg-slate-50/30 flex flex-col w-full max-w-[100vw] focus:outline-none"
      >
        {/* Subtle page background glows (Mesh Gradient effect) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        
        <div className={`relative z-10 w-full flex-1 ${showSidebar ? 'p-4 md:p-8 max-w-6xl mx-auto' : ''}`}>
          {children}
        </div>

        {/* Global Footer */}
        <Footer />
      </main>
    </div>
  );
}
