/**
 * Literature & Citation Service Types
 */

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'bibtex';

export type LiteratureSource = 'pubmed' | 'crossref' | 'semanticscholar';

export interface Author {
  firstName?: string;
  lastName?: string;
  name: string;
}

export interface LiteratureItem {
  id: string;
  externalId: string;
  source: LiteratureSource;
  title: string;
  authors: Author[];
  journal?: string;
  year?: number;
  publicationDate?: string;
  doi?: string;
  abstract?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  citationCount?: number;
}

export interface LiteratureSearchOptions {
  limit?: number;
  offset?: number;
  yearFrom?: number;
  yearTo?: number;
  sources?: LiteratureSource[];
  timeoutMs?: number;
  signal?: AbortSignal;
  skipCache?: boolean;
  cacheTtl?: number;
  retries?: number;
  throwOnError?: boolean;
}

export interface LiteratureSearchResult {
  query: string;
  total: number;
  items: LiteratureItem[];
  sources: {
    pubmed: number;
    crossref: number;
    semanticscholar?: number;
  };
  errors?: {
    pubmed?: string;
    crossref?: string;
    semanticscholar?: string;
  };
  cached?: boolean;
}

export interface ClientOptions {
  baseUrl?: string;
  apiKey?: string;
  defaultTimeoutMs?: number;
  retries?: number;
  cache?: any; // LiteratureCache
}
