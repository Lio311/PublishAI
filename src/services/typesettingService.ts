import { generatePdf } from "@/lib/export/pdf-generator";

export async function generatePDF(markdownContent: string): Promise<Buffer> {
  // Extract title from first line if it starts with #
  const lines = markdownContent.split('\n');
  let title = 'Untitled Document';
  let content = markdownContent;
  
  if (lines[0]?.startsWith('#')) {
    title = lines[0].replace(/^#+\s*/, '');
    content = lines.slice(1).join('\n');
  }
  
  return generatePdf(title, content);
}
