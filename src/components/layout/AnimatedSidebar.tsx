"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { FileText, Home, Settings, LogOut, Globe, Book, Link as LinkIcon, ChevronRight } from "lucide-react";

export default function AnimatedSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const nextLocale = locale === 'he' ? 'en' : 'he';
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    if (pathname === '/' || pathname === `/${locale}`) {
      router.push(`/${nextLocale}`);
    } else {
      router.push(newPath);
    }
  };

  const menuItems = [
    { name: t("home"), icon: Home, href: `/${locale}` },
    { name: t("myPapers"), icon: FileText, href: `/${locale}/papers` },
    { name: locale === 'he' ? 'חיבור לעיתונים' : 'Journal Connections', icon: LinkIcon, href: `/${locale}/connections` },
    { name: locale === 'he' ? 'חוקי עיתונים' : 'Journal Rules', icon: Book, href: `/${locale}/journals` },
    { name: t("settings"), icon: Settings, href: `/${locale}/settings` },
  ];

  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/${locale}/admin` });
  }

  return (
    <aside 
      className="relative w-[280px] m-4 lg:m-6 flex flex-col justify-between rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden z-20"
    >
      {/* Subtle animated gradient background inside sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10 flex-1 flex flex-col">
        <div className="flex items-center justify-center mb-10 pt-2">
          <Image 
            src="/logo.png" 
            alt="PublishAI Logo" 
            width={240} 
            height={160} 
            className="object-contain"
            priority
          />
        </div>
        
        <motion.nav 
          className="space-y-2 flex-1"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
            
            return (
              <motion.div
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
              >
                <Link
                  href={item.href}
                  className={`relative flex items-center justify-between px-4 py-3.5 rounded-2xl font-medium transition-colors duration-300 z-10 ${
                    isActive ? "text-blue-900" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "text-blue-600 scale-110" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="tracking-wide text-[15px]">{item.name}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-arrow"
                      className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                    />
                  )}
                </Link>

                {/* Hover Background */}
                <AnimatePresence>
                  {hoveredIndex === index && !isActive && (
                    <motion.div
                      layoutId="sidebar-hover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-100/60 rounded-2xl z-0"
                    />
                  )}
                </AnimatePresence>

                {/* Active Background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-blue-100/80 to-blue-50/30 rounded-2xl border border-blue-200/50 shadow-[inset_0_2px_10px_rgba(255,255,255,1)] z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.nav>
      </div>

      {/* Bottom Section */}
      <div className="p-6 relative z-10">
        <div className="p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-md">
          <button 
            onClick={toggleLanguage}
            className="flex w-full items-center justify-between px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-slate-200/50 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[14px]">{locale === 'he' ? 'English' : 'עברית'}</span>
            </div>
          </button>
          
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-2 my-1" />
          
          {session ? (
            <button 
              onClick={() => signOut()} 
              className="flex w-full items-center justify-between px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-200/50 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-[14px]">{t("logout")}</span>
              </div>
            </button>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="flex w-full items-center justify-between px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-200/50 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-[14px]">{locale === 'he' ? 'התחבר' : 'Login'}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
