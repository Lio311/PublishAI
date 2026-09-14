import { Document, Packer, Paragraph, TextRun } from "docx";

export async function generateDocx(title: string, content: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 400 },
          }),
          // Split by paragraphs
          ...content.split("\n\n").map(
            (para) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: para.trim(),
                    size: 24, // 12pt
                  }),
                ],
                spacing: { after: 200 },
              })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as unknown as Buffer;
}
