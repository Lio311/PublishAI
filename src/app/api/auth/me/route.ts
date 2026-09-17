import { NextResponse } from "next/server";
import { getSafeAuth, getSafeDb } from "@/lib/api/db-helper";
import { DUMMY_USER } from "@/lib/api/dummy-data";

export async function GET() {
  try {
    const session = await getSafeAuth();
    const db = await getSafeDb();

    if (session?.user?.id && db) {
      try {
        const { users } = await import("@/db/schema");
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

    // Default scaffold fallback when not authenticated or during early MVP dev
    return NextResponse.json({
      authenticated: false,
      user: DUMMY_USER,
      message: "Scaffolded session profile (dummy data active)",
    });
  } catch (error) {
    console.error("[API auth/me] Error:", error);
    return NextResponse.json({
      authenticated: false,
      user: DUMMY_USER,
      message: "Fallback scaffold profile",
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const session = await getSafeAuth();
    const db = await getSafeDb();

    if (session?.user?.id && db) {
      try {
        const { users } = await import("@/db/schema");
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

    return NextResponse.json({
      success: true,
      message: "User profile updated (scaffolded)",
      user: {
        ...DUMMY_USER,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[API auth/me PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
