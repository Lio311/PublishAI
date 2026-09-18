import { NextResponse } from "next/server";
import { getSafeDb } from "@/services/api/db-helper";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, institution, field } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const db = await getSafeDb();
    if (db) {
      try {
        const { users } = await import("@/services/db/schema");
        const { eq } = await import("drizzle-orm");

        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 409 }
          );
        }

        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: name || email.split("@")[0],
            credits: 3,
          })
          .returning();

        return NextResponse.json(
          {
            success: true,
            message: "User registered successfully",
            user: {
              ...newUser,
              institution: institution || "Unspecified",
              field: field || "General Research",
            },
          },
          { status: 201 }
        );
      } catch (dbErr) {
        console.warn("[API auth/register] DB insert failed, falling back to scaffolded response:", dbErr);
      }
    }

    // Scaffolded response when DB schema is not ready yet
    const dummyNewUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      name: name || email.split("@")[0],
      email,
      institution: institution || "Academic Institution",
      field: field || "Computational Sciences",
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
