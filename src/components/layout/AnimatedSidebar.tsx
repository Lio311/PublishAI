"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, usePathname, useRouter } from "@/app/i18n/routing";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { FileText, Home, Settings, LogOut, LogIn, Globe, Book, Link as LinkIcon, Send, Share2, Brain, X, Workflow, BarChart3 } from "lucide-react";

export default function AnimatedSidebar({ isAdmin, onClose }: { isAdmin: boolean, onClose?: () => void }) {
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
    // next-intl router automatically handles injecting the new locale
    router.replace(pathname, { locale: nextLocale });
  };

  const menuItems = [
    { name: t("home"), icon: Home, href: `/` },
    { name: t("myPapers"), icon: FileText, href: `/papers` },
    { name: t("connections"), icon: LinkIcon, href: `/connections` },
    { name: t("rules"), icon: Book, href: `/journals` },
    { name: t("submissions"), icon: Send, href: `/submissions` },
    { name: t("analytics"), icon: BarChart3, href: `/analytics` },
    { name: t("settings"), icon: Settings, href: `/settings` },
  ];

  if (isAdmin) {
    menuItems.push({ name: t("admin"), icon: Globe, href: `/admin` });
    menuItems.push({ name: t("learning"), icon: Brain, href: `/learning` });
    
    // Admin-only menu items, but accessible via direct link to anyone with site password
    menuItems.push({ name: t("architecture"), icon: Share2, href: `/architecture` });
    menuItems.push({ name: t("flowchart"), icon: Workflow, href: `/flowchart` });
  }

  const activeItem = [...menuItems].sort((a, b) => b.href.length - a.href.length).find(
    item => item.href === '/' ? pathname === '/' : (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  return (
    <aside 
      aria-label={t("navigation")}
      className="relative w-[280px] h-full min-h-[100dvh] md:min-h-0 md:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] m-0 md:m-4 lg:m-6 flex flex-col justify-between rounded-none md:rounded-[2rem] bg-white/95 md:bg-white/70 backdrop-blur-2xl border-none md:border md:border-white/50 shadow-[2px_0_32px_rgba(0,0,0,0.05)] overflow-hidden z-20"
    >
      {/* Subtle animated gradient background inside sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 to-transparent pointer-events-none" aria-hidden="true" />

      {onClose && (
        <button 
          type="button"
          onClick={onClose}
          aria-label={t("closeMenu")}
          className="md:hidden absolute top-4 end-4 p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors z-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}
      
      <div className="p-4 md:p-6 pt-6 md:pt-4 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-center mb-4 lg:mb-6 pt-2 shrink-0 relative">
          <Link 
            href="/" 
            aria-label="PublishAI Home"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-2xl block"
          >
            <Image 
              src="/logo.png" 
              alt="PublishAI Logo" 
              width={240} 
              height={160} 
              className="object-contain w-36 md:w-[240px]"
              priority
            />
          </Link>
        </div>
        
        <motion.nav 
          aria-label={t("navigation")}
          className="space-y-0.5 lg:space-y-1 flex-1 overflow-y-auto scrollbar-hide min-h-0"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {menuItems.map((item, index) => {
            const isActive = activeItem?.href === item.href;
            
            return (
              <motion.div
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
              >
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center justify-between px-4 py-2.5 rounded-2xl font-medium transition-colors duration-300 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isActive ? "text-sky-800" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <item.icon aria-hidden="true" className={`w-5 h-5 transition-transform duration-300 ${isActive ? "text-sky-500 scale-110" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="tracking-wide text-[15px]">{item.name}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-arrow"
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                    />
                  )}
                </Link>

                {/* Hover Background */}
                <AnimatePresence>
                  {hoveredIndex === index && !isActive && (
                    <motion.div
                      layoutId="sidebar-hover"
                      aria-hidden="true"
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
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-sky-100/80 to-sky-50/30 rounded-2xl border border-sky-200/50 shadow-[inset_0_2px_10px_rgba(255,255,255,1)] z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 lg:px-6 lg:py-4 relative z-10 shrink-0">
        <div className="p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-md">
          <button 
            type="button"
            onClick={toggleLanguage}
            aria-label={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
            className="flex w-full items-center justify-between px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-slate-200/50 group-hover:bg-sky-100 group-hover:text-sky-500 transition-colors">
                <Globe className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-[14px]">{locale === 'he' ? 'English' : 'עברית'}</span>
            </div>
          </button>
          
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-2 my-1" aria-hidden="true" />
          
          {session ? (
            <button 
              type="button"
              onClick={() => signOut()} 
              aria-label={t("logout")}
              className="flex w-full items-center justify-between px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-200/50 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[14px]">{t("logout")}</span>
              </div>
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => signIn()} 
              aria-label={t("login")}
              className="flex w-full items-center justify-between px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-sky-600 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-200/50 group-hover:bg-sky-100 group-hover:text-sky-500 transition-colors">
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[14px]">{t("login")}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
