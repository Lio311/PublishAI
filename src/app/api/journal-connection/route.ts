import { NextResponse } from "next/server";
import { db } from "@/db";
import { journalConnections } from "@/db/schema";
import { encrypt } from "@/lib/security/encryption";
import { auth } from "@/auth"; // Assuming standard next-auth setup
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { platform, siteUrl, username, password, displayName, testResult } = body;

    if (!platform || !siteUrl || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const encryptedUsername = encrypt(username);
    const encryptedPassword = password ? encrypt(password) : encrypt("");

    const newConnection = await db.insert(journalConnections).values({
      userId: session.user.id,
      platform,
      siteUrl,
      displayName: displayName || new URL(siteUrl).hostname,
      encryptedUsername,
      encryptedPassword,
      connectionStatus: testResult?.success ? "connected" : "untested",
      remoteUserDisplayName: testResult?.userDisplayName,
      remoteUserRole: testResult?.userRole,
      lastTestedAt: new Date(),
    }).returning();

    // Return the created connection without the encrypted fields
    const { encryptedUsername: _u, encryptedPassword: _p, ...safeConnection } = newConnection[0];

    return NextResponse.json(safeConnection);
  } catch (error: any) {
    console.error("Error creating journal connection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await db.query.journalConnections.findMany({
      where: eq(journalConnections.userId, session.user.id),
      orderBy: (connections, { desc }) => [desc(connections.createdAt)],
    });

    // Strip encrypted credentials before sending to client
    const safeConnections = connections.map(c => {
      const { encryptedUsername, encryptedPassword, ...safe } = c;
      return safe;
    });

    return NextResponse.json(safeConnections);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
