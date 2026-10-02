import { desc, eq } from "drizzle-orm";
import { db } from "@/services/db";
import { documents, papers } from "@/services/db/schema";
import { readPaperFile } from "@/services/storage/paperFiles";
import { extractTextFromBuffer, normalizeText } from "./extractText";

/**
 * The extracted manuscript text is stored once, in the `documents` table, and
 * every background job loads it by paper id. Events carry ids only: Inngest
 * caps event payload size, and full manuscripts routinely exceed it.
 */

const HTML_TAG = /<\/?(p|h[1-6]|ul|ol|li|br|strong|em|blockquote|div|span)\b[^>]*>/i;

/** The editor saves HTML; agents and matchers want plain text. */
export function htmlToText(content: string): string {
  if (!HTML_TAG.test(content)) return content;
  return normalizeText(
    content
      .replace(/<(br|\/p|\/h[1-6]|\/li|\/div|\/blockquote)\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

/** Plain extracted text to minimal editor HTML (one paragraph per block). */
export function textToHtml(text: string): string {
  if (HTML_TAG.test(text)) return text;
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escape(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function saveManuscript(input: {
  userId: string;
  paperId: number;
  title: string;
  text: string;
  fileUrl: string;
  fileType: string;
}): Promise<string> {
  const [doc] = await db
    .insert(documents)
    .values({
      userId: input.userId,
      paperId: input.paperId,
      title: input.title,
      content: input.text,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      wordCount: countWords(input.text),
      status: "draft",
    })
    .returning({ id: documents.id });
  return doc.id;
}

/**
 * Returns the paper's latest stored manuscript text. Falls back to re-extracting
 * from the original upload for papers created before text was stored.
 */
export async function loadManuscriptText(paperId: number): Promise<string | null> {
  const [doc] = await db
    .select({ content: documents.content })
    .from(documents)
    .where(eq(documents.paperId, paperId))
    .orderBy(desc(documents.createdAt))
    .limit(1);
  if (doc?.content?.trim()) return htmlToText(doc.content);

  const [paper] = await db.select({ fileUrl: papers.originalFileUrl }).from(papers).where(eq(papers.id, paperId));
  if (!paper?.fileUrl) return null;

  const file = await readPaperFile(paper.fileUrl);
  if (!file) return null;
  const text = normalizeText(await extractTextFromBuffer(file.buffer, file.filename));
  return text || null;
}

/** Merges fields into the latest manuscript document's metadata (e.g. integrity reports). */
export async function updateManuscriptMetadata(paperId: number, patch: Record<string, unknown>): Promise<void> {
  const [doc] = await db
    .select({ id: documents.id, metadata: documents.metadata })
    .from(documents)
    .where(eq(documents.paperId, paperId))
    .orderBy(desc(documents.createdAt))
    .limit(1);
  if (!doc) return;
  await db
    .update(documents)
    .set({ metadata: { ...((doc.metadata as Record<string, unknown>) ?? {}), ...patch }, updatedAt: new Date() })
    .where(eq(documents.id, doc.id));
}

/** Splits the document into sections by its headings (HTML <h1-3> or numbered/markdown headings). */
export function splitSections(content: string): Array<{ id: string; title: string; content: string; wordCount: number; order: number }> {
  const html = /<h[1-3][^>]*>/i.test(content);
  const parts = html
    ? content.split(/(?=<h[1-3][^>]*>)/i).map((chunk) => {
        const title = chunk.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
        return { title, body: htmlToText(chunk.replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/i, "")) };
      })
    : content.split(/\n(?=(?:#{1,3} |\d+(?:\.\d+)*\.? )[A-Z])/).map((chunk) => {
        const [first, ...rest] = chunk.split("\n");
        return { title: first.replace(/^#{1,3} /, "").trim(), body: rest.join("\n").trim() };
      });

  return parts
    .filter((p) => p.title || p.body)
    .map((p, i) => ({
      id: `sec_${i + 1}`,
      title: p.title || (i === 0 ? "Front matter" : `Section ${i + 1}`),
      content: p.body,
      wordCount: countWords(p.body),
      order: i + 1,
    }));
}
