import { 
  documentService, 
  exportToWord, 
  exportToPdf, 
  exportDocument, 
  importFromWord, 
  importFromPdf, 
  importDocument, 
  parseReviewerReport, 
  formatDocument 
} from '../src/services/documents';

jest.mock('mammoth', () => ({
  convertToHtml: jest.fn().mockResolvedValue({ value: '<p>Test content from docx</p>' }),
  extractRawText: jest.fn().mockResolvedValue({ value: 'Test content from docx' }),
}));

jest.mock('pdf-parse/lib/pdf-parse.js', () => {
  return jest.fn().mockResolvedValue({
    text: 'Extracted PDF text sample',
    numpages: 2,
    info: { Title: 'Sample PDF' },
  });
});

describe('DocumentService', () => {
  describe('Export functions', () => {
    it('exports content to Word (.docx)', async () => {
      const buffer = await exportToWord('Test Paper', '# Introduction\n\nThis is a test paper.');
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('exports content to PDF (.pdf)', async () => {
      const buffer = await exportToPdf('Test Paper', 'This is a test paper content.');
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('latin1')).toContain('%PDF');
    });

    it('exports via master exportDocument method', async () => {
      const resultDocx = await exportDocument({
        title: 'My Manuscript',
        content: 'Content here',
        format: 'docx',
      });
      expect(resultDocx.format).toBe('docx');
      expect(resultDocx.filename).toBe('my_manuscript.docx');
      expect(resultDocx.mimeType).toContain('wordprocessingml');

      const resultPdf = await exportDocument({
        title: 'My Manuscript',
        content: 'Content here',
        format: 'pdf',
      });
      expect(resultPdf.format).toBe('pdf');
      expect(resultPdf.filename).toBe('my_manuscript.pdf');
      expect(resultPdf.mimeType).toBe('application/pdf');
    });
  });

  describe('Import functions', () => {
    it('imports from Word using mammoth', async () => {
      const dummyBuffer = Buffer.from('mock docx');
      const result = await importFromWord(dummyBuffer);
      expect(result.format).toBe('docx');
      expect(result.text).toBe('Test content from docx');
      expect(result.html).toBe('<p>Test content from docx</p>');
      expect(result.metadata.wordCount).toBe(4);
    });

    it('imports from PDF using pdf-parse', async () => {
      const dummyBuffer = Buffer.from('mock pdf');
      const result = await importFromPdf(dummyBuffer);
      expect(result.format).toBe('pdf');
      expect(result.text).toBe('Extracted PDF text sample');
      expect(result.metadata.pageCount).toBe(2);
    });

    it('routes file formats automatically in importDocument', async () => {
      const dummyBuffer = Buffer.from('mock data');
      const docxResult = await importDocument(dummyBuffer, 'paper.docx');
      expect(docxResult.format).toBe('docx');

      const pdfResult = await importDocument(dummyBuffer, 'paper.pdf');
      expect(pdfResult.format).toBe('pdf');

      const txtResult = await importDocument(Buffer.from('Hello plain text'), 'notes.txt');
      expect(txtResult.format).toBe('txt');
      expect(txtResult.text).toBe('Hello plain text');
    });
  });

  describe('parseReviewerReport', () => {
    it('parses structured reviewer comments and editor feedback', async () => {
      const report = [
        'Editor Comments:',
        'Please address the comments from both reviewers with a detailed response letter.',
        '',
        'Reviewer 1:',
        '1. Major concern: The methodology section lacks detail on the control group.',
        '2. Minor typo in table 2 caption.',
        '',
        'Reviewer 2:',
        'The paper provides a valuable contribution. However:',
        'The literature review is missing references to recent 2025 studies.',
        'Please clarify the sample size calculation.'
      ].join('\n');

      const parsed = await parseReviewerReport(report);
      expect(parsed.editorComments).toBeDefined();
      expect(parsed.editorComments).toContain('Please address the comments');
      expect(parsed.reviewers.length).toBe(2);
      expect(parsed.totalComments).toBeGreaterThanOrEqual(3);

      const r1 = parsed.reviewers.find(r => r.reviewerId.includes('1'));
      expect(r1).toBeDefined();
      expect(r1?.comments.some(c => c.severity === 'major')).toBe(true);
    });
  });

  describe('formatDocument', () => {
    it('applies style templates', async () => {
      const raw = 'As seen in (2024), this is a breakthrough.';
      const formatted = await formatDocument(raw, {
        targetFormat: 'markdown',
        styleTemplate: 'ieee',
      });
      expect(formatted).toContain('[(2024)]');
    });
  });
});
