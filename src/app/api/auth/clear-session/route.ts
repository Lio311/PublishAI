import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/services/rate-limit';

export async function GET(request: Request) {
  const rateLimitResponse = await applyRateLimit(request, "auth");
  if (rateLimitResponse) return rateLimitResponse;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const url = new URL('/he', request.url);
  const response = NextResponse.redirect(url);
  
  for (const cookie of allCookies) {
    if (cookie.name.includes('authjs.session-token') || cookie.name.includes('next-auth.session-token')) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    }
  }
  
  return response;
}
