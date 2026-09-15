import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function generateDocx(title: string, content: string): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  // Match block-level elements
  const blockRegex = /<(h[1-6]|p|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let hasHtml = false;
  
  while ((match = blockRegex.exec(content)) !== null) {
    hasHtml = true;
    const tag = match[1].toLowerCase();
    const innerHtml = match[2];
    
    if (tag.startsWith('h')) {
      const levelNum = parseInt(tag[1], 10);
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6
      ][levelNum - 1];
      
      children.push(new Paragraph({
        children: parseTextRuns(innerHtml),
        heading: headingLevel,
        spacing: { before: 240, after: 120 },
      }));
    } else if (tag === 'p') {
      children.push(new Paragraph({
        children: parseTextRuns(innerHtml),
        spacing: { after: 200 },
      }));
    } else if (tag === 'ul' || tag === 'ol') {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        children.push(new Paragraph({
          children: parseTextRuns(liMatch[1]),
          bullet: tag === 'ul' ? { level: 0 } : undefined,
          numbering: tag === 'ol' ? { reference: "default-numbering", level: 0 } : undefined,
          spacing: { after: 100 },
        }));
      }
    }
  }

  // Fallback for plain text
  if (!hasHtml && content.trim().length > 0) {
    content.split("\n\n").forEach(para => {
      if (para.trim()) {
         children.push(new Paragraph({
           children: [new TextRun({ text: para.trim(), size: 24 })],
           spacing: { after: 200 },
         }));
      }
    });
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as unknown as Buffer;
}

function parseTextRuns(html: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = html.split(/(<[^>]+>)/g);
  
  let isBold = false;
  let isItalic = false;
  
  for (const part of parts) {
    if (!part) continue;
    
    if (part.startsWith('<')) {
      const tag = part.toLowerCase();
      if (tag === '<strong>' || tag === '<b>') isBold = true;
      else if (tag === '</strong>' || tag === '</b>') isBold = false;
      else if (tag === '<em>' || tag === '<i>') isItalic = true;
      else if (tag === '</em>' || tag === '</i>') isItalic = false;
    } else {
      let text = part
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
        
      if (text) {
        runs.push(new TextRun({
          text,
          bold: isBold,
          italics: isItalic,
          size: 24,
        }));
      }
    }
  }
  
  return runs.length > 0 ? runs : [new TextRun({ text: "", size: 24 })];
}
