/**
 * Manuscript files live in a private Vercel Blob store. Their URLs are not
 * directly downloadable, so every read goes through these helpers (and every
 * browser download through an authenticated API route).
 */

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
};

export function mimeTypeForFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

export function filenameFromBlobUrl(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() || "manuscript");
  } catch {
    return "manuscript";
  }
}

/** Uploads a user's manuscript under a per-user prefix with a random suffix (no name collisions). */
export async function storePaperFile(userId: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120) || "manuscript";
  const { put } = await import("@vercel/blob");
  const blob = await put(`articles/${userId}/${safeName}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || mimeTypeForFilename(safeName),
  });
  return blob.url;
}

export async function openPaperFile(url: string) {
  const { get } = await import("@vercel/blob");
  const result = await get(url, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  return result;
}

export async function readPaperFile(url: string): Promise<{ buffer: Buffer; contentType: string; filename: string } | null> {
  const result = await openPaperFile(url);
  if (!result) return null;
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
  const filename = filenameFromBlobUrl(url);
  return { buffer, contentType: result.blob.contentType || mimeTypeForFilename(filename), filename };
}
