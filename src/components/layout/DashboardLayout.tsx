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
    <div className="min-h-screen flex bg-gray-50 text-slate-900 font-sans" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-${locale === 'he' ? 'l' : 'r'} border-slate-200 flex flex-col justify-between`}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-8">
            <Image 
              src="/logo.png" 
              alt="PublishAI Logo" 
              width={160} 
              height={60} 
              className="object-contain"
              priority
            />
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-200 space-y-2">
          <button 
            onClick={toggleLanguage}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Globe className="w-5 h-5 text-slate-400" />
            {locale === 'he' ? 'English' : 'עברית'}
          </button>
          
          {session ? (
            <button 
              onClick={() => signOut()} 
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              {t("logout")}
            </button>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              {locale === 'he' ? 'התחבר' : 'Login'}
            </button>
          )}
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
