"use client";

import { usePathname } from "@/app/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";

import Header from "./Header";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef(pathname);

  // Close mobile menu if resized to desktop
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

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
    if (!isMobile || !isMobileMenuOpen) {
      return;
    }
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
  }, [isMobile, isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
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
      {/* Header (Public Top Header or Mobile Burger Header) */}
      <Header
        showSidebar={showSidebar}
        isAdmin={isAdmin}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        hamburgerButtonRef={hamburgerButtonRef}
      />

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[65] md:hidden transition-opacity cursor-pointer touch-manipulation pointer-events-auto"
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
              ? 'translate-x-0 pointer-events-auto visible' 
              : (locale === 'he' 
                  ? 'translate-x-full md:translate-x-0 md:pointer-events-auto pointer-events-none invisible md:visible' 
                  : '-translate-x-full md:translate-x-0 md:pointer-events-auto pointer-events-none invisible md:visible')}
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
        className="flex-1 min-w-0 overflow-auto relative bg-slate-50/30 flex flex-col w-full max-w-full focus:outline-none"
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
