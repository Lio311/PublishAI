import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import GlobalPasswordProtection from '@/components/layout/GlobalPasswordProtection';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { Toaster } from 'sonner';

const openSans = Open_Sans({ subsets: ["latin", "hebrew"] });

export const metadata: Metadata = {
  title: "PublishAI - Automated Academic Paper Revision",
  description: "End-to-end AI agent system for academic paper revision and submission.",
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const session = await auth();

  // Determine direction
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={`${openSans.className} bg-gray-50 min-h-screen text-slate-900`}>
        <NextIntlClientProvider messages={messages}>
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
      </body>
    </html>
  );
}
