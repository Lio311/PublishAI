import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/services/rate-limit';

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const searchParams = new URL(request.url).searchParams;
    const redirectParam = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/he";
    const safeRedirect = redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/he";

    const url = new URL(safeRedirect, request.url);
    const response = NextResponse.redirect(url);

    for (const cookie of allCookies) {
      if (
        cookie.name.includes("authjs.session-token") ||
        cookie.name.includes("next-auth.session-token") ||
        cookie.name.includes("authjs.csrf-token") ||
        cookie.name.includes("next-auth.csrf-token") ||
        cookie.name.includes("authjs.callback-url") ||
        cookie.name.includes("next-auth.callback-url")
      ) {
        response.cookies.set(cookie.name, "", {
          maxAge: 0,
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
    }

    return response;
  } catch (error) {
    console.error("[API clear-session] Error:", error);
    return NextResponse.redirect(new URL("/he", request.url));
  }
}
