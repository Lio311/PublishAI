/**
 * Literature & Citation Service Types
 */

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'bibtex';

export interface Author {
  firstName?: string;
  lastName?: string;
  name: string;
}

export interface LiteratureItem {
  id: string;
  externalId: string;
  source: 'pubmed' | 'crossref';
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
  useDummy?: boolean;
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
  };
  errors?: {
    pubmed?: string;
    crossref?: string;
  };
  cached?: boolean;
}

export interface ClientOptions {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  retries?: number;
  cache?: any; // LiteratureCache
}
