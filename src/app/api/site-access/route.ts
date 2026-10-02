import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { applyRateLimit } from "@/services/rate-limit";
import {
  SITE_ACCESS_COOKIE,
  SITE_ACCESS_TTL_SECONDS,
  createSiteAccessToken,
  getSitePin,
  isCorrectPin,
  isValidSiteAccessToken,
} from "@/services/security/siteAccess";

/** Whether the PIN gate is enabled and whether this browser already passed it. */
export async function GET() {
  if (!getSitePin()) {
    return NextResponse.json({ required: false, granted: true });
  }
  const token = (await cookies()).get(SITE_ACCESS_COOKIE)?.value;
  return NextResponse.json({ required: true, granted: isValidSiteAccessToken(token) });
}

export async function POST(req: Request) {
  // A 4-digit PIN is brute-forceable without a strict per-IP limit.
  const limited = await applyRateLimit(req, "auth");
  if (limited) return limited;

  if (!getSitePin()) {
    return NextResponse.json({ granted: true });
  }

  const body = await req.json().catch(() => ({}));
  if (!isCorrectPin(body?.pin)) {
    return NextResponse.json({ granted: false, error: "Invalid PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ granted: true });
  response.cookies.set(SITE_ACCESS_COOKIE, createSiteAccessToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SITE_ACCESS_TTL_SECONDS,
  });
  return response;
}
