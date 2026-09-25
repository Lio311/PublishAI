import { Document, Packer, Paragraph, TextRun } from "docx";

/**
 * Service for exporting documents to Word (.docx)
 */
export class DocumentExportService {
  /**
   * Exports an HTML or Markdown article to a .docx file format.
   * @param content The HTML or Markdown content to export.
   * @param title The title of the document.
   * @returns A Buffer containing the generated .docx file.
   */
  public async exportToDocx(content: string, title: string): Promise<Buffer> {
    if (!content) {
      throw new Error('Content is required for export.');
    }

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 48,
                }),
              ],
            }),
            ...content.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                  }),
                ],
              })
            )
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}

export const documentExportService = new DocumentExportService();
