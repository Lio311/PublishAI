import { NextResponse } from "next/server";
import { getSafeAuth, getSafeDb } from "@/services/api/db-helper";
import { applyRateLimit } from "@/services/rate-limit";

export async function GET(req: Request) {
  try {
    const session = await getSafeAuth();

    const rateLimitResponse = await applyRateLimit(req, "read", session?.user?.id);
    if (rateLimitResponse) return rateLimitResponse;

    const db = await getSafeDb();

    if (session?.user?.id && db) {
      try {
        const { users } = await import("@/services/db/schema");
        const { eq } = await import("drizzle-orm");
        const [dbUser] = await db.select().from(users).where(eq(users.id, session.user.id));
        if (dbUser) {
          return NextResponse.json({
            authenticated: true,
            user: {
              id: dbUser.id,
              name: dbUser.name || "Academic Researcher",
              email: dbUser.email,
              image: dbUser.image || null,
              emailVerified: dbUser.emailVerified || null,
              role: "researcher",
              credits: dbUser.credits ?? 3,
              isMock: false,
            },
          });
        }
      } catch (dbErr) {
        console.warn("[API auth/me] DB query failed, returning session user or dummy:", dbErr);
      }
    }

    if (session?.user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id || "usr_session",
          name: session.user.name || "Academic Researcher",
          email: session.user.email || "",
          image: session.user.image || null,
          role: "researcher",
          credits: 3,
          isMock: false,
        },
      });
    }

    return NextResponse.json({
      authenticated: false,
      user: null,
      message: "Unauthenticated",
    }, { status: 401 });
  } catch (error) {
    console.error("[API auth/me] Error:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      message: "Unauthenticated",
    }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSafeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(req, "write", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const db = await getSafeDb();

    if (db) {
      try {
        const { users } = await import("@/services/db/schema");
        const { eq } = await import("drizzle-orm");

        const updateData: { name?: string; image?: string } = {};
        if (typeof body.name === "string") {
          updateData.name = body.name.trim().slice(0, 100);
        }
        if (typeof body.image === "string") {
          updateData.image = body.image.trim().slice(0, 1000);
        }

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, session.user.id))
          .returning();

        if (updatedUser) {
          return NextResponse.json({
            success: true,
            user: {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              image: updatedUser.image,
              credits: updatedUser.credits ?? 3,
              role: "researcher",
              isMock: false,
            },
          });
        }
      } catch (dbErr) {
        console.warn("[API auth/me PATCH] DB update failed:", dbErr);
      }
    }

    return NextResponse.json({ error: "User update failed or database unavailable" }, { status: 500 });
  } catch (error) {
    console.error("[API auth/me PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
