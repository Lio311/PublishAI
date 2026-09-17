export type DocumentFormat = 'docx' | 'pdf' | 'markdown' | 'txt' | 'html';

export type JournalStyleTemplate = 
  | 'apa' 
  | 'ieee' 
  | 'nature' 
  | 'springer' 
  | 'chicago' 
  | 'harvard' 
  | 'generic';

export interface DocumentMetadata {
  title?: string;
  authors?: string[];
  abstractText?: string;
  keywords?: string[];
  pageCount?: number;
  wordCount?: number;
  dateCreated?: Date;
  journalTarget?: string;
  [key: string]: any;
}

export interface ExportDocumentOptions {
  title: string;
  content: string;
  format: 'docx' | 'pdf';
  style?: JournalStyleTemplate;
  authors?: string[];
  abstractText?: string;
  keywords?: string[];
  includeLineNumbers?: boolean;
  doubleSpaced?: boolean;
  fontSize?: number;
  fontFamily?: string;
  footerText?: string;
}

export interface DocumentExportResult {
  buffer: Buffer;
  format: 'docx' | 'pdf';
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface DocumentImportOptions {
  extractHtml?: boolean;
  extractRawText?: boolean;
  includeMetadata?: boolean;
}

export interface DocumentImportResult {
  text: string;
  html?: string;
  format: DocumentFormat;
  metadata: DocumentMetadata;
}

export interface ReviewerCommentItem {
  id: string;
  reviewerId: string;
  commentNumber: number;
  rawText: string;
  category?: 'methodology' | 'clarity' | 'literature' | 'data' | 'grammar' | 'general';
  severity?: 'major' | 'minor' | 'suggestion';
  suggestedAction?: string;
}

export interface ParsedReviewerReport {
  rawText: string;
  editorComments?: string;
  reviewers: Array<{
    reviewerId: string;
    comments: ReviewerCommentItem[];
  }>;
  totalComments: number;
  summary?: string;
}

export interface DocumentFormatOptions {
  targetFormat: DocumentFormat;
  styleTemplate?: JournalStyleTemplate;
  doubleSpaced?: boolean;
  twoColumns?: boolean;
  includeLineNumbers?: boolean;
}
