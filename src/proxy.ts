import createMiddleware from "next-intl/middleware";
import { routing } from "./app/i18n/routing";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import { validateCsrf } from "@/services/security/csrf";
import { applySecurityHeaders } from "@/services/security/headers";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Handle API routes: bypass next-intl localization
  if (pathname.startsWith("/api")) {
    // Enforce CSRF protections on non-NextAuth state-changing methods
    const csrfResult = validateCsrf(req);
    if (!csrfResult.isAllowed) {
      const response = NextResponse.json(
        { error: csrfResult.error || "Forbidden: CSRF validation failed" },
        { status: csrfResult.statusCode || 403 }
      );
      applySecurityHeaders(response.headers);
      return response;
    }

    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  // Handle page routes: apply localization and security headers
  const response = intlMiddleware(req);
  if (response) {
    applySecurityHeaders(response.headers);
  }
  return response;
});

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
