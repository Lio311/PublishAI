import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const protectedPatterns = ['/dashboard', '/papers', '/settings', '/submissions', '/admin'];

// Routes that should always be public
const publicPatterns = ['/api/auth', '/api/inngest', '/api/webhooks'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public API routes
  if (publicPatterns.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Apply intl middleware first
  const intlResponse = intlMiddleware(request);

  // Check if route needs protection (strip locale prefix for matching)
  const pathnameWithoutLocale = pathname.replace(/^\/(he|en)/, '') || '/';
  const isProtected = protectedPatterns.some(p => pathnameWithoutLocale.startsWith(p));

  if (isProtected) {
    // Check for session token in cookies (NextAuth v5 JWT strategy)
    const sessionToken = request.cookies.get('authjs.session-token')?.value 
      || request.cookies.get('__Secure-authjs.session-token')?.value;
    
    if (!sessionToken && process.env.NEXT_PUBLIC_E2E_TEST !== 'true') {
      const locale = pathname.match(/^\/(he|en)/)?.[1] || 'he';
      const signInUrl = new URL(`/${locale}`, request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(he|en)/:path*', '/api/:path*']
};
