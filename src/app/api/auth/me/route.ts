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
              ...dbUser,
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

    const body = await req.json();
    const db = await getSafeDb();

    if (db) {
      try {
        const { users } = await import("@/services/db/schema");
        const { eq } = await import("drizzle-orm");
        const [updatedUser] = await db
          .update(users)
          .set({
            name: body.name,
            image: body.image,
          })
          .where(eq(users.id, session.user.id))
          .returning();

        if (updatedUser) {
          return NextResponse.json({
            success: true,
            user: updatedUser,
          });
        }
      } catch (dbErr) {
        console.warn("[API auth/me PATCH] DB update failed:", dbErr);
      }
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("[API auth/me PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
