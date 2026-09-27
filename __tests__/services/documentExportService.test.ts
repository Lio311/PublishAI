import { documentExportService } from '../../src/services/documentExportService';

describe('DocumentExportService', () => {
  it('should export document to docx format', async () => {
    const title = 'Test Document';
    const content = 'This is a test content that needs to be exported to docx.';
    const buffer = await documentExportService.exportToDocx(content, title);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should throw an error if content is empty', async () => {
    await expect(documentExportService.exportToDocx('', 'Title')).rejects.toThrow('Content is required for export.');
  });
});
