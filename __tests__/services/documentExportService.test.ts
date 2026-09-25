import { documentExportService } from '../../src/services/documentExportService';

describe('DocumentExportService', () => {
  it('should export document to docx format', async () => {
    const title = 'Test Document';
    const content = 'This is a test content that needs to be exported to docx.';
    const buffer = await documentExportService.exportToDocx(content, title);
    
    expect(buffer).toBeInstanceOf(Buffer);
    const text = buffer.toString('utf-8');
    expect(text).toContain(`Mock DOCX Content for ${title}`);
    expect(text).toContain(content.substring(0, 50));
  });

  it('should throw an error if content is empty', async () => {
    await expect(documentExportService.exportToDocx('', 'Title')).rejects.toThrow('Content is required for export.');
  });
});
