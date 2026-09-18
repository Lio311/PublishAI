import mammoth from 'mammoth';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { generateDocx } from "@/services/export/docx-generator";
import { generatePdf } from "@/services/export/pdf-generator";
import util from 'util';
import {
  DocumentFormat,
  DocumentMetadata,
  ExportDocumentOptions,
  DocumentExportResult,
  DocumentImportOptions,
  DocumentImportResult,
  ReviewerCommentItem,
  ParsedReviewerReport,
  DocumentFormatOptions,
} from './types';

// Ensure TextEncoder / TextDecoder exist in Node environment
if (typeof global !== 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const util = require('util');
    if (typeof (global as any).TextEncoder === 'undefined' && util.TextEncoder) {
      (global as any).TextEncoder = util.TextEncoder;
    }
    if (typeof (global as any).TextDecoder === 'undefined' && util.TextDecoder) {
      (global as any).TextDecoder = util.TextDecoder;
    }
  } catch {
    // Ignore if not in node
  }
}

export class DocumentService {
  /**
   * Export document to Microsoft Word (.docx) format
   */
  async exportToWord(
    title: string,
    content: string,
    options?: Partial<ExportDocumentOptions>
  ): Promise<Buffer> {
    const formattedContent = this.prepareContentForExport(content, options);
    return generateDocx(title, formattedContent);
  }

  /**
   * Export document to PDF (.pdf) format
   */
  async exportToPdf(
    title: string,
    content: string,
    options?: Partial<ExportDocumentOptions>
  ): Promise<Buffer> {
    const formattedContent = this.prepareContentForExport(content, options);
    return generatePdf(title, formattedContent);
  }

  /**
   * Master document exporter
   */
  async exportDocument(options: ExportDocumentOptions): Promise<DocumentExportResult> {
    const { title, content, format } = options;
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'document';

    let buffer: Buffer;
    let mimeType: string;

    if (format === 'docx') {
      buffer = await this.exportToWord(title, content, options);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (format === 'pdf') {
      buffer = await this.exportToPdf(title, content, options);
      mimeType = 'application/pdf';
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      buffer,
      format,
      filename: `${sanitizedTitle}.${format}`,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Import and parse a Microsoft Word (.docx) file
   */
  async importFromWord(
    buffer: Buffer,
    _options?: DocumentImportOptions
  ): Promise<DocumentImportResult> {
    try {
      const [htmlResult, textResult] = await Promise.all([
        mammoth.convertToHtml({ buffer }),
        mammoth.extractRawText({ buffer }),
      ]);

      const text = textResult.value.trim();
      const html = htmlResult.value;
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

      return {
        text,
        html,
        format: 'docx',
        metadata: {
          wordCount,
          dateCreated: new Date(),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to parse Word document: ${error.message}`);
    }
  }

  /**
   * Import and parse a PDF (.pdf) file
   */
  async importFromPdf(
    buffer: Buffer,
    _options?: DocumentImportOptions
  ): Promise<DocumentImportResult> {
    try {
      const result = await pdfParse(buffer);
      const text = (result.text || '').trim();
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

      return {
        text,
        format: 'pdf',
        metadata: {
          pageCount: result.numpages || 1,
          wordCount,
          info: result.info,
          dateCreated: new Date(),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to parse PDF document: ${error.message}`);
    }
  }

  /**
   * Detect format and import document from buffer
   */
  async importDocument(
    buffer: Buffer,
    filenameOrMime: string,
    options?: DocumentImportOptions
  ): Promise<DocumentImportResult> {
    const lower = filenameOrMime.toLowerCase();

    if (lower.endsWith('.docx') || lower.includes('officedocument.wordprocessingml')) {
      return this.importFromWord(buffer, options);
    }

    if (lower.endsWith('.pdf') || lower.includes('application/pdf')) {
      return this.importFromPdf(buffer, options);
    }

    // Default to plain text / markdown / html string decoding
    const text = buffer.toString('utf-8');
    let format: DocumentFormat = 'txt';
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) format = 'markdown';
    else if (lower.endsWith('.html') || lower.endsWith('.htm')) format = 'html';

    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

    return {
      text,
      html: format === 'html' ? text : undefined,
      format,
      metadata: {
        wordCount,
        dateCreated: new Date(),
      },
    };
  }

  /**
   * Parser for Reviewer Reports / Editorial Decision Letters
   * Breaks raw text into structured comments categorized by reviewer.
   * Directly supports the Review Response Agent.
   */
  async parseReviewerReport(
    input: Buffer | string,
    filenameOrMime?: string
  ): Promise<ParsedReviewerReport> {
    let rawText: string;

    if (Buffer.isBuffer(input)) {
      const imported = await this.importDocument(input, filenameOrMime || 'report.txt');
      rawText = imported.text;
    } else {
      rawText = input;
    }

    if (!rawText || !rawText.trim()) {
      return {
        rawText: '',
        reviewers: [],
        totalComments: 0,
      };
    }

    // Split into sections by reviewer or editor
    const reviewerSections = this.splitReviewerSections(rawText);
    const reviewers: ParsedReviewerReport['reviewers'] = [];
    let editorComments: string | undefined;
    let totalComments = 0;

    for (const section of reviewerSections) {
      if (section.id.toLowerCase().includes('editor')) {
        editorComments = section.text.trim();
        continue;
      }

      const comments = this.extractCommentItems(section.id, section.text);
      totalComments += comments.length;

      reviewers.push({
        reviewerId: section.id,
        comments,
      });
    }

    return {
      rawText,
      editorComments,
      reviewers,
      totalComments,
      summary: `Extracted ${totalComments} comments across ${reviewers.length} reviewer(s)`,
    };
  }

  /**
   * Format document according to journal guidelines / presets
   */
  async formatDocument(
    content: string,
    options: DocumentFormatOptions
  ): Promise<string> {
    let formatted = content;

    // Apply template transformations
    if (options.styleTemplate) {
      switch (options.styleTemplate) {
        case 'ieee':
          // IEEE typically uses [1], [2] citation style and two-column indicators
          formatted = formatted.replace(/\((?:19|20)\d{2}\)/g, '[$&]');
          break;
        case 'apa':
          // APA typically uses double spacing and title-case headers
          if (options.doubleSpaced) {
            formatted = formatted.replace(/\n/g, '\n\n');
          }
          break;
        case 'nature':
          // Nature style formatting placeholder
          break;
        default:
          break;
      }
    }

    return formatted;
  }

  /**
   * Helper: Prepare markdown / HTML content for export
   */
  private prepareContentForExport(
    content: string,
    options?: Partial<ExportDocumentOptions>
  ): string {
    let prepared = content;

    // Prepend metadata if provided
    const metadataBlocks: string[] = [];
    if (options?.authors && options.authors.length > 0) {
      metadataBlocks.push(`<p><strong>Authors:</strong> ${options.authors.join(', ')}</p>`);
    }
    if (options?.abstractText) {
      metadataBlocks.push(`<h3>Abstract</h3><p>${options.abstractText}</p>`);
    }
    if (options?.keywords && options.keywords.length > 0) {
      metadataBlocks.push(`<p><strong>Keywords:</strong> ${options.keywords.join('; ')}</p>`);
    }

    if (metadataBlocks.length > 0) {
      prepared = metadataBlocks.join('\n') + '\n\n' + prepared;
    }

    // If content is pure markdown (starts with # or contains markdown headers and no HTML)
    if (!prepared.includes('<p>') && !prepared.includes('<h1>') && !prepared.includes('<div>')) {
      prepared = this.markdownToHtml(prepared);
    }

    return prepared;
  }

  /**
   * Helper: basic markdown to HTML converter for export engines
   */
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3></h3>')
      .replace(/^## (.*$)/gim, '<h2></h2>')
      .replace(/^# (.*$)/gim, '<h1></h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong></strong>')
      .replace(/\*(.*?)\*/gim, '<em></em>')
      .replace(/^\s*[-*] (.*$)/gim, '<ul><li></li></ul>')
      .replace(/(<\/ul>\s*<ul>)/gim, '')
      .split(/\n{2,}/)
      .map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
          return trimmed;
        }
        return `<p>${trimmed}</p>`;
      })
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Helper: Split reviewer report by reviewer headers
   */
  private splitReviewerSections(text: string): Array<{ id: string; text: string }> {
    const lines = text.split(/\r?\n/);
    const sections: Array<{ id: string; text: string }> = [];
    let currentId = 'General / Editor';
    let currentLines: string[] = [];

    const reviewerHeaderRegex = /^(?:Reviewer\s*(?:#|Number)?\s*([A-Za-z0-9]+)|Associate\s+Editor|Editor(?:'s)?\s+Comments?)/i;

    for (const line of lines) {
      const match = line.trim().match(reviewerHeaderRegex);
      if (match) {
        if (currentLines.length > 0) {
          sections.push({ id: currentId, text: currentLines.join('\n') });
          currentLines = [];
        }
        if (match[1]) {
          currentId = `Reviewer ${match[1]}`;
        } else {
          currentId = 'Editor';
        }
      } else {
        currentLines.push(line);
      }
    }

    if (currentLines.length > 0) {
      sections.push({ id: currentId, text: currentLines.join('\n') });
    }

    return sections;
  }

  /**
   * Helper: Extract individual comment items from a reviewer section
   */
  private extractCommentItems(reviewerId: string, sectionText: string): ReviewerCommentItem[] {
    const lines = sectionText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const rawItems: string[] = [];
    let currentItem = '';

    const itemStartRegex = /^(?:(?:\d+[\.)]|[-*•]|\bPoint\s*\d+[:.]?|\bComment\s*\d+[:.]?)\s*)/i;

    for (const line of lines) {
      if (itemStartRegex.test(line)) {
        if (currentItem) {
          rawItems.push(currentItem);
        }
        currentItem = line;
      } else {
        if (currentItem && !line.includes(':') && currentItem.length < 500) {
          currentItem += ' ' + line;
        } else {
          if (currentItem) rawItems.push(currentItem);
          currentItem = line;
        }
      }
    }
    if (currentItem) {
      rawItems.push(currentItem);
    }

    const comments: ReviewerCommentItem[] = [];
    let counter = 1;

    for (const raw of rawItems) {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length < 15) continue;

      // Classify severity
      const lower = trimmed.toLowerCase();
      let severity: ReviewerCommentItem['severity'] = 'minor';
      if (lower.includes('major') || lower.includes('crucial') || lower.includes('fatal') || lower.includes('invalid') || lower.includes('must')) {
        severity = 'major';
      } else if (lower.includes('suggest') || lower.includes('typo') || lower.includes('consider') || lower.includes('minor')) {
        severity = 'minor';
      }

      // Classify category
      let category: ReviewerCommentItem['category'] = 'general';
      if (lower.includes('method') || lower.includes('experiment') || lower.includes('protocol')) {
        category = 'methodology';
      } else if (lower.includes('data') || lower.includes('table') || lower.includes('figure') || lower.includes('sample')) {
        category = 'data';
      } else if (lower.includes('reference') || lower.includes('cite') || lower.includes('literature')) {
        category = 'literature';
      } else if (lower.includes('grammar') || lower.includes('spelling') || lower.includes('english')) {
        category = 'grammar';
      } else if (lower.includes('clar') || lower.includes('explain') || lower.includes('ambiguous')) {
        category = 'clarity';
      }

      comments.push({
        id: `${reviewerId.replace(/\s+/g, '_').toLowerCase()}-item-${counter}`,
        reviewerId,
        commentNumber: counter++,
        rawText: trimmed,
        category,
        severity,
      });
    }

    return comments;
  }
}

export const documentService = new DocumentService();

export const exportToWord = documentService.exportToWord.bind(documentService);
export const exportToPdf = documentService.exportToPdf.bind(documentService);
export const exportDocument = documentService.exportDocument.bind(documentService);
export const importFromWord = documentService.importFromWord.bind(documentService);
export const importFromPdf = documentService.importFromPdf.bind(documentService);
export const importDocument = documentService.importDocument.bind(documentService);
export const parseReviewerReport = documentService.parseReviewerReport.bind(documentService);
export const formatDocument = documentService.formatDocument.bind(documentService);
