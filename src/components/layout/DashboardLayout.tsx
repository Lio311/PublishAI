"use client";

import { FileText, Home, Settings, LogOut, Globe, Book, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

import AnimatedSidebar from "./AnimatedSidebar";

export default function DashboardLayout({ 
  children,
  isAdmin = false 
}: { 
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const locale = useLocale();

  return (
    <div className="min-h-screen flex bg-slate-50/50 text-slate-900 font-sans" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <AnimatedSidebar isAdmin={isAdmin} />

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
