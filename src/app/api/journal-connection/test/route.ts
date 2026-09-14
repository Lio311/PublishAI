import { NextResponse } from "next/server";
import { ConnectionTester } from "@/lib/submission/connection-tester";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { platform, siteUrl, username, password } = body;

    if (!platform || !siteUrl || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await ConnectionTester.testConnection(platform, siteUrl, username, password);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error testing connection:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
