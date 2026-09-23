"use client";

import { FileText, Home, Settings, LogOut, Globe, Book, Link as LinkIcon, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
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
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className={`min-h-screen flex ${showSidebar ? "flex-col md:flex-row" : "flex-col"} bg-slate-50/50 text-slate-900 font-sans overflow-x-hidden w-full`} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      
      {/* Public Top Header (when no sidebar) */}
      {!showSidebar && (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full">
          {/* Left section (empty in LTR, holds button in RTL if we use flex-1, but since it's dir-aware, flex-row behaves correctly) */}
          <div className="flex-1 flex justify-start">
            {/* Can add language switcher or other elements here later if needed */}
          </div>
          
          <Link href={`/${locale}`} className="flex-1 flex justify-center">
             <Image src="/logo.png" alt="PublishAI Logo" width={130} height={40} className="object-contain" priority />
          </Link>
          
          <div className="flex-1 flex justify-end items-center gap-3">
            <Link href={`/${locale}/login`} className="text-sm font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-sky-100 transition-colors shadow-sm">
              {locale === 'he' ? 'התחברות למערכת' : 'Login'}
            </Link>
          </div>
        </header>
      )}

      {/* Mobile Header (only when there IS a sidebar) */}
      {showSidebar && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] shadow-sm w-full">
          <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[65] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {showSidebar && (
        <div className={`
          fixed inset-y-0 h-full md:sticky md:top-0 md:flex z-[70] md:z-50 md:h-screen py-0 md:py-0
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : (locale === 'he' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
          ${locale === 'he' ? 'right-0' : 'left-0'}
        `}>
          <AnimatedSidebar isAdmin={isAdmin} onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-slate-50/30 flex flex-col w-full max-w-[100vw]">

        {/* Subtle page background glows (Mesh Gradient effect) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className={`relative z-10 w-full ${showSidebar ? 'p-4 md:p-8 max-w-6xl mx-auto' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
