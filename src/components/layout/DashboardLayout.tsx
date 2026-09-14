"use client";

import { FileText, Home, Settings, LogOut, Globe, Book, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

export default function DashboardLayout({ 
  children,
  isAdmin = false 
}: { 
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

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
    <div className="min-h-screen flex bg-transparent text-slate-900 font-sans" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`w-72 bg-white/90 backdrop-blur-xl border-${locale === 'he' ? 'l' : 'r'} border-slate-200/60 shadow-[4px_0_32px_rgba(0,0,0,0.02)] flex flex-col justify-between z-20`}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-10 mt-2">
            <Image 
              src="/logo.png" 
              alt="PublishAI Logo" 
              width={160} 
              height={60} 
              className="object-contain hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
          
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 overflow-hidden ${
                    isActive 
                      ? "text-blue-900 bg-blue-50/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]" 
                      : "text-slate-500 hover:text-blue-800"
                  }`}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute start-0 inset-y-2 w-1.5 bg-gradient-to-b from-blue-800 to-sky-400 rounded-e-full shadow-[0_0_10px_rgba(14,165,233,0.4)]" />
                  )}
                  
                  {/* Hover background effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-slate-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  
                  <item.icon className={`w-5 h-5 relative z-10 transition-all duration-300 ${
                    isActive 
                      ? "text-blue-700 scale-110" 
                      : "text-slate-400 group-hover:text-blue-600 group-hover:scale-110"
                  }`} />
                  <span className="relative z-10 tracking-wide text-[15px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 mb-2">
          <div className="p-2 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] space-y-1">
            <button 
              onClick={toggleLanguage}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm transition-all duration-300 group"
            >
              <Globe className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-[14px]">{locale === 'he' ? 'English' : 'עברית'}</span>
            </button>
            
            {session ? (
              <button 
                onClick={() => signOut()} 
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                <span className="text-[14px]">{t("logout")}</span>
              </button>
            ) : (
              <button 
                onClick={() => signIn()} 
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-[14px]">{locale === 'he' ? 'התחבר' : 'Login'}</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
