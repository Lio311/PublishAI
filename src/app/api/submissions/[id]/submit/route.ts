import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { inngest } from "@/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const submissionId = Number(id);

    if (isNaN(submissionId) || submissionId <= 0) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    // Trigger Inngest background job for the RPA workflow
    await inngest.send({
      name: "submission/process",
      data: { submissionId },
    });

    return NextResponse.json({
      success: true,
      message: "Submission process triggered via Inngest",
    });
  } catch (error: any) {
    console.error("[API submissions/[id]/submit POST] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
