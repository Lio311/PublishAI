"use client";

import { Menu, Globe, User } from "lucide-react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/app/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

import AnimatedSidebar from "./AnimatedSidebar";
import Footer from "./Footer";

const emptySubscribe = () => () => {};

function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia("(max-width: 767px)");
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
}

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
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef(pathname);

  // Close mobile menu if resized to desktop
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  const toggleLanguage = useCallback(() => {
    const nextLocale = locale === 'he' ? 'en' : 'he';
    router.replace(pathname, { locale: nextLocale });
  }, [locale, router, pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsMobileMenuOpen(false);
    }
  }, [pathname]);

  // Close mobile menu on Escape key press and restore focus to hamburger button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        hamburgerButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Focus management and focus trapping when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      // Focus first focusable element inside the drawer
      const focusables = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      }

      // Trap focus inside drawer
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== "Tab" || !sidebarRef.current) return;
        const currentFocusables = sidebarRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!currentFocusables || currentFocusables.length === 0) return;

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", handleTabKey);
      return () => window.removeEventListener("keydown", handleTabKey);
    }
  }, [isMobile, isMobileMenuOpen]);

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
        <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full" role="banner">
          <div className="flex-1 flex justify-start items-center">
            {/* Language Switcher for public/top header */}
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={`${t("switchLanguage")}: ${locale === 'he' ? 'English' : 'עברית'}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'he' ? 'English' : 'עברית'}</span>
            </button>
          </div>
          
          <Link href="/" aria-label="PublishAI Home" className="flex-1 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg shrink-0">
             <Image src="/logo.png" alt="PublishAI Logo" width={130} height={40} className="object-contain" priority />
          </Link>
          
          <div className="flex-1 flex justify-end items-center gap-3">
            {!mounted || status === "loading" ? (
              <div className="h-9 w-20 flex items-center justify-center shrink-0" aria-hidden="true">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 truncate max-w-[160px]">
                  <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span className="truncate">{session.user?.name || session.user?.email}</span>
                </span>
                <button 
                  type="button"
                  onClick={() => signOut()}
                  aria-label={t("logout")}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full border border-red-100 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => signIn()}
                aria-label={t("login")}
                className="text-xs md:text-sm font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-sky-100 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0"
              >
                {t("login")}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Mobile Header (only when there IS a sidebar) */}
      {showSidebar && (
        <header className="md:hidden relative flex items-center justify-between px-4 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] shadow-sm w-full h-[72px]" role="banner">
          <button 
            ref={hamburgerButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t("openMenu")}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-sidebar"
            className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors shrink-0"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <Link href="/" aria-label="PublishAI Home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg shrink-0">
            <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
          </Link>
          <div className="w-9 shrink-0" aria-hidden="true" />
        </header>
      )}

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[65] md:hidden transition-opacity touch-none"
          onClick={() => {
            setIsMobileMenuOpen(false);
            hamburgerButtonRef.current?.focus();
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      {showSidebar && (
        <div 
          ref={sidebarRef}
          id="mobile-sidebar"
          role={isMobile && isMobileMenuOpen ? "dialog" : undefined}
          aria-modal={isMobile && isMobileMenuOpen ? "true" : undefined}
          aria-label={isMobile && isMobileMenuOpen ? t("navigation") : undefined}
          aria-hidden={isMobile && !isMobileMenuOpen ? "true" : undefined}
          tabIndex={isMobile && isMobileMenuOpen ? -1 : undefined}
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
          <AnimatedSidebar 
            isAdmin={isAdmin} 
            onClose={() => {
              setIsMobileMenuOpen(false);
              hamburgerButtonRef.current?.focus();
            }} 
          />
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
