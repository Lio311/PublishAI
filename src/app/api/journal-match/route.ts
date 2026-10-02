import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/auth";
import { applyRateLimit } from "@/services/rate-limit";
import { AgentError } from "@/services/journal-matcher/agents";
import { assertUsableText, extractManuscriptText, ExtractionError } from "@/services/documents/extractText";
import { matchJournals, MatchError } from "@/services/journal-matcher/pipeline";
import type { MatchPreferences, MatchProgressEvent } from "@/services/journal-matcher/types";

// Five sequential/parallel agent stages plus bibliographic lookups.
export const maxDuration = 300;

const fieldsSchema = z.object({
  text: z.string().optional(),
  priority: z.enum(["balanced", "impact", "speed"]).default("balanced"),
  openAccessOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  maxApcUsd: z.coerce.number().int().min(0).max(20000).optional(),
  locale: z.enum(["he", "en"]).default("he"),
});

function errorCode(error: unknown): string {
  if (error instanceof ExtractionError || error instanceof AgentError || error instanceof MatchError) {
    return error.code;
  }
  return "INTERNAL";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each match runs ~15 model calls, so it uses the strictest tier.
  const limited = await applyRateLimit(req, "strict", session.user.id);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data", code: "BAD_REQUEST" }, { status: 400 });
  }

  const parsed = fieldsSchema.safeParse({
    text: formData.get("text") ?? undefined,
    priority: formData.get("priority") ?? undefined,
    openAccessOnly: formData.get("openAccessOnly") ?? undefined,
    maxApcUsd: formData.get("maxApcUsd") || undefined,
    locale: formData.get("locale") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", code: "BAD_REQUEST" }, { status: 400 });
  }
  const { text, locale, ...prefFields } = parsed.data;
  const prefs: MatchPreferences = { ...prefFields, maxApcUsd: prefFields.maxApcUsd ?? null };

  // Extract before streaming so input problems return a plain 4xx.
  let manuscriptText: string;
  try {
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      manuscriptText = await extractManuscriptText(file);
    } else if (text?.trim()) {
      manuscriptText = assertUsableText(text);
    } else {
      return NextResponse.json({ error: "Upload a manuscript or paste its text", code: "BAD_REQUEST" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof ExtractionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    throw error;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: MatchProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const result = await matchJournals(manuscriptText, prefs, locale, send);
        send({ type: "result", result });
      } catch (error) {
        const code = errorCode(error);
        console.error(`[JournalMatcher] Match failed (${code}):`, error);
        const message = code === "INTERNAL" ? "Journal matching failed" : (error as Error).message;
        send({ type: "error", error: message, code });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
