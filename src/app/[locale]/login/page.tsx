'use client';

import { useLocale } from 'next-intl';
import { signIn } from "next-auth/react";
import Image from 'next/image';

export default function LoginPage() {
  const locale = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {locale === 'he' ? 'התחברות למערכת' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {locale === 'he' ? 'ההתחברות מתבצעת באופן מאובטח דרך חשבון גוגל' : 'Authentication is securely handled via Google'}
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => signIn("google", { callbackUrl: `/${locale}` })}
            className="flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Image src="https://authjs.dev/img/providers/google.svg" alt="Google" width={20} height={20} />
            {locale === 'he' ? 'התחברות עם Google' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
