import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from "@/app/i18n/routing";
import { notFound } from 'next/navigation';
import GlobalPasswordProtection from '@/components/layout/GlobalPasswordProtection';
import { SessionProvider } from 'next-auth/react';
import { auth } from "@/app/auth";
import { Toaster } from 'sonner';
import DynamicBackground from '@/components/layout/DynamicBackground';
import AlertOverride from '@/components/layout/AlertOverride';

// The only typeface in the app. Exposed as --font-open-sans so Tailwind's font-sans and
// font-mono utilities resolve to it as well (see globals.css).
const openSans = Open_Sans({ subsets: ["latin", "hebrew"], variable: "--font-open-sans", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "PublishAI - Automated Academic Paper Revision",
  description: "End-to-end AI agent system for academic paper revision and submission.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const session = await auth();

  // Determine direction
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} translate="no" className={openSans.variable}>
      <body className={`${openSans.className} bg-transparent min-h-screen text-slate-900`}>
        <DynamicBackground />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider session={session}>
            <GlobalPasswordProtection>
              {children}
            </GlobalPasswordProtection>
          </SessionProvider>
        </NextIntlClientProvider>
        <Toaster 
          position="top-center" 
          dir={dir}
          richColors 
          closeButton
          toastOptions={{
            style: {
              direction: dir,
            },
          }}
        />
        <AlertOverride />
      </body>
    </html>
  );
}
