"use client";

import { useMemo, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/app/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, Globe, User, Home, FileText, Share2, Workflow, ShieldCheck } from "lucide-react";

export interface HeaderProps {
  showSidebar?: boolean;
  isAdmin?: boolean;
  isMobileMenuOpen?: boolean;
  onOpenMobileMenu?: () => void;
  hamburgerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const emptySubscribe = () => () => {};

export default function Header({
  showSidebar = true,
  isAdmin = false,
  isMobileMenuOpen = false,
  onOpenMobileMenu,
  hamburgerButtonRef,
}: HeaderProps) {
  const locale = useLocale();
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const isEffectiveAdmin = isAdmin || (session?.user as { role?: string })?.role === "admin";

  const toggleLanguage = useCallback(() => {
    const nextLocale = locale === "he" ? "en" : "he";
    router.replace(pathname, { locale: nextLocale });
  }, [locale, router, pathname]);

  const cleanPath = pathname ? pathname.replace(/\/$/, "") || "/" : "/";

  const isItemActive = useCallback(
    (href: string) => {
      if (href === "/") {
        return cleanPath === "/";
      }
      return cleanPath === href || cleanPath.startsWith(`${href}/`);
    },
    [cleanPath]
  );

  const publicNavItems = useMemo(() => {
    const items = [
      { href: "/", label: t("home"), icon: Home },
      { href: "/papers", label: t("myPapers"), icon: FileText },
      { href: "/architecture", label: t("architecture"), icon: Share2 },
      { href: "/flowchart", label: t("flowchart"), icon: Workflow },
    ];

    if (isEffectiveAdmin) {
      items.push({ href: "/admin", label: t("admin"), icon: ShieldCheck });
    }

    return items;
  }, [t, isEffectiveAdmin]);

  // When showSidebar is true, render the Mobile Header for small screens (<md)
  if (showSidebar) {
    return (
      <header
        role="banner"
        aria-label={t("sidebar")}
        className="md:hidden relative flex items-center justify-between px-4 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] shadow-sm w-full h-[72px]"
      >
        <button
          ref={hamburgerButtonRef}
          type="button"
          onClick={onOpenMobileMenu}
          aria-label={t("openMenu")}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidebar"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 bg-slate-100 rounded-xl text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors shrink-0 cursor-pointer"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <Link
          href="/"
          aria-label="PublishAI Home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg shrink-0 px-2 py-1"
        >
          <Image
            src="/logo.png"
            alt="PublishAI Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* Quick mobile language toggle button with proper 44x44 hit target */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={`${t("switchLanguage")}: ${locale === "he" ? "English" : "עברית"}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase">{locale === "he" ? "EN" : "עב"}</span>
          </button>
        </div>
      </header>
    );
  }

  // When showSidebar is false, render the Public Desktop and Mobile Header with full navigation
  return (
    <header
      role="banner"
      aria-label={t("sidebar")}
      className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full"
    >
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link
          href="/"
          aria-label="PublishAI Home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg shrink-0"
        >
          <Image
            src="/logo.png"
            alt="PublishAI Logo"
            width={130}
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* Mobile controls when no sidebar is present */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={`${t("switchLanguage")}: ${locale === "he" ? "English" : "עברית"}`}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
          </button>
          {mounted && status === "authenticated" ? (
            <button
              type="button"
              onClick={() => signOut()}
              aria-label={t("logout")}
              className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
            >
              {t("logout")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn()}
              aria-label={t("login")}
              className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 transition-colors"
            >
              {t("login")}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links with Active State Styling */}
      <nav
        aria-label={t("navigation")}
        className="flex items-center gap-1 overflow-x-auto py-2 md:py-0 scrollbar-hide"
      >
        {publicNavItems.map((item) => {
          const isActive = isItemActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl text-xs md:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0 ${
                isActive
                  ? "bg-sky-50 text-sky-700 font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                  isActive ? "text-sky-600" : "text-slate-400"
                }`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Right Side: Language & Auth Controls */}
      <div className="hidden md:flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={`${t("switchLanguage")}: ${locale === "he" ? "English" : "עברית"}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{locale === "he" ? "English" : "עברית"}</span>
        </button>

        {!mounted || status === "loading" ? (
          <div className="h-9 w-20 flex items-center justify-center shrink-0" aria-hidden="true">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : session ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 truncate max-w-[160px]">
              <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="truncate">{session.user?.name || session.user?.email}</span>
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              aria-label={t("logout")}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full border border-red-100 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0 cursor-pointer"
            >
              {t("logout")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn()}
            aria-label={t("login")}
            className="text-xs md:text-sm font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-sky-100 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0 cursor-pointer"
          >
            {t("login")}
          </button>
        )}
      </div>
    </header>
  );
}
