import mammoth from "mammoth";
// @ts-expect-error pdf-parse's internal entry has no type declarations; the package root runs a self-test on import
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MIN_TEXT_CHARS = 400;
/** ~150k tokens: well inside the model context, large enough for any single manuscript. */
export const MAX_TEXT_CHARS = 600_000;

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md"] as const;

export class ExtractionError extends Error {
  constructor(message: string, public code: "UNSUPPORTED_TYPE" | "TOO_LARGE" | "EMPTY_TEXT" | "TOO_LONG" | "PARSE_FAILED") {
    super(message);
    this.name = "ExtractionError";
  }
}

export function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function assertUsableText(text: string): string {
  const normalized = normalizeText(text);
  if (normalized.length < MIN_TEXT_CHARS) {
    throw new ExtractionError("Not enough text could be extracted (is it a scanned PDF?)", "EMPTY_TEXT");
  }
  if (normalized.length > MAX_TEXT_CHARS) {
    throw new ExtractionError("The manuscript is too long to analyze in one pass", "TOO_LONG");
  }
  return normalized;
}

export function assertSupportedFile(filename: string, size: number): void {
  const ext = fileExtension(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ExtractionError(`Unsupported file type: .${ext}`, "UNSUPPORTED_TYPE");
  }
  if (size > MAX_FILE_BYTES) {
    throw new ExtractionError("File exceeds the 20MB limit", "TOO_LARGE");
  }
}

/** Raw text from a document buffer, without length validation. */
export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = fileExtension(filename);
  try {
    if (ext === "pdf") {
      return (await pdfParse(buffer)).text;
    }
    if (ext === "docx") {
      return (await mammoth.extractRawText({ buffer })).value;
    }
    return buffer.toString("utf8");
  } catch (error) {
    console.error(`[extractText] Text extraction failed for ${filename}:`, error);
    throw new ExtractionError("The file could not be read", "PARSE_FAILED");
  }
}

/** Extracts and validates plain text from an uploaded manuscript (PDF, DOCX, TXT or Markdown). */
export async function extractManuscriptText(file: File): Promise<string> {
  assertSupportedFile(file.name, file.size);
  const text = await extractTextFromBuffer(Buffer.from(await file.arrayBuffer()), file.name);
  return assertUsableText(text);
}
