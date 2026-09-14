import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PublishAI - Automated Academic Paper Revision",
  description: "End-to-end AI agent system for academic paper revision and submission.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.className} bg-gray-50 min-h-screen text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
