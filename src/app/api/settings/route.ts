import { auth } from "@/app/auth";
import { db } from "@/services/db";
import { userSettings, users } from "@/services/db/schema";
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
      openaiApiKey: null,
      anthropicApiKey: null,
    };
  }

  // Indicate whether each key is configured via env vars (never expose the actual key)
  const { openaiApiKey: _o, anthropicApiKey: _a, ...safeSettings } = settings;
  return NextResponse.json({
    ...safeSettings,
    name: user?.name,
    email: user?.email,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    googleConfigured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
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
  } = body;

  // API keys are managed via server environment variables — not stored per user
  const updateData = {
    academicRole,
    language,
    emailNotifications,
    browserNotifications,
    weeklyDigest,
    publicProfile,
    dataCollectionForAi,
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
