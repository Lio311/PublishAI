import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const { submissionId, solution } = await req.json();

    if (!submissionId || !solution) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId, solution" },
        { status: 400 }
      );
    }

    await inngest.send({
      name: "submission/captcha-solved",
      data: {
        submissionId,
        solution,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error solving captcha:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
