import { auth } from "@/auth";
import { db } from "@/db";
import { userSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!settings) {
    // Return default settings
    settings = {
      id: 0,
      userId: session.user.id,
      academicRole: null,
      language: "he",
      emailNotifications: true,
      browserNotifications: false,
      weeklyDigest: true,
      publicProfile: true,
      dataCollectionForAi: false,
      openaiApiKey: "",
      anthropicApiKey: "",
    };
  }

  return NextResponse.json({ ...settings, name: user?.name, email: user?.email });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Update user name if provided
  if (body.name) {
    await db.update(users).set({ name: body.name }).where(eq(users.id, session.user.id));
  }

  // Check if settings exist
  const existingSettings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  const {
    academicRole,
    language,
    emailNotifications,
    browserNotifications,
    weeklyDigest,
    publicProfile,
    dataCollectionForAi,
    openaiApiKey,
    anthropicApiKey,
  } = body;

  const updateData = {
    academicRole,
    language,
    emailNotifications,
    browserNotifications,
    weeklyDigest,
    publicProfile,
    dataCollectionForAi,
    openaiApiKey,
    anthropicApiKey,
  };

  if (existingSettings) {
    await db.update(userSettings)
      .set(updateData)
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db.insert(userSettings).values({
      userId: session.user.id,
      ...updateData,
    });
  }

  return NextResponse.json({ success: true });
}
