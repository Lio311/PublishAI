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
  isAdmin = false 
}: { 
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50 text-slate-900 font-sans" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative top-0 md:flex z-50 h-screen md:h-auto py-0 md:py-0
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : (locale === 'he' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
        ${locale === 'he' ? 'right-0' : 'left-0'}
      `}>
        <AnimatedSidebar isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-slate-50/30">
        {/* Subtle page background glows (Mesh Gradient effect) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-8 max-w-6xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
