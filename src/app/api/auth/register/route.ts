import { NextResponse } from "next/server";
import { getSafeDb } from "@/services/api/db-helper";
import { applyRateLimit } from "@/services/rate-limit";

export async function POST(req: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(req, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { email, name, institution, field } = body || {};

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : cleanEmail.split("@")[0];
    const cleanInstitution = typeof institution === "string" && institution.trim() ? institution.trim().slice(0, 100) : "Unspecified";
    const cleanField = typeof field === "string" && field.trim() ? field.trim().slice(0, 100) : "General Research";

    const db = await getSafeDb();
    if (db) {
      try {
        const { users } = await import("@/services/db/schema");
        const { eq } = await import("drizzle-orm");

        const existing = await db.select().from(users).where(eq(users.email, cleanEmail));
        if (existing.length > 0) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 409 }
          );
        }

        const [newUser] = await db
          .insert(users)
          .values({
            email: cleanEmail,
            name: cleanName,
            credits: 3,
          })
          .returning();

        return NextResponse.json(
          {
            success: true,
            message: "User registered successfully",
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              credits: newUser.credits ?? 3,
              institution: cleanInstitution,
              field: cleanField,
              role: "researcher",
              isMock: false,
            },
          },
          { status: 201 }
        );
      } catch (dbErr) {
        console.error("[API auth/register] DB insert failed:", dbErr);
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Failed to register user due to database error" },
            { status: 500 }
          );
        }
      }
    }

    // Scaffolded response only in non-production when DB is unavailable
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const dummyNewUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      name: cleanName,
      email: cleanEmail,
      institution: cleanInstitution,
      field: cleanField,
      credits: 3,
      role: "researcher",
      createdAt: new Date().toISOString(),
      isMock: true,
    };

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully (scaffolded)",
        user: dummyNewUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API auth/register] Error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
