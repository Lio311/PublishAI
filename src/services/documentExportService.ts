/**
 * Mock service for exporting documents to Word (.docx)
 */
export class DocumentExportService {
  /**
   * Exports an HTML or Markdown article to a .docx file format.
   * @param content The HTML or Markdown content to export.
   * @param title The title of the document.
   * @returns A Buffer containing the generated .docx file (mocked).
   */
  public async exportToDocx(content: string, title: string): Promise<Buffer> {
    console.log(`Mocking export of document "${title}" to .docx format...`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!content) {
      throw new Error('Content is required for export.');
    }

    // In a real scenario, we might use python-docx via a python bridge or docx npm package
    // Here we return a mock buffer representing the .docx file
    const mockDocxContent = `Mock DOCX Content for ${title}\n\n${content.substring(0, 50)}...`;
    
    return Buffer.from(mockDocxContent, 'utf-8');
  }
}

export const documentExportService = new DocumentExportService();
