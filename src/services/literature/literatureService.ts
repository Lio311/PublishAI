/**
 * Literature & Citation Service for PublishAI
 * 
 * Provides resilient, cached API wrappers for PubMed, Crossref, and Semantic Scholar services.
 * Strictly does NOT use arXiv (arXiv requests are redirected/replaced with PubMed/Semantic Scholar).
 * Features client-side rate limiting, Retry-After coordination, deadline-aware timeouts,
 * multi-tier caching, and citation formatting.
 */

import {
  Author,
  CitationStyle,
  ClientOptions,
  LiteratureItem,
  LiteratureSearchOptions,
  LiteratureSearchResult,
  LiteratureSource,
} from './types';
import {
  LiteratureApiError,
  NotFoundError,
  RateLimitError,
  RemoteServerError,
  TimeoutError,
} from './errors';
import { LiteratureCache, literatureCache } from './literatureCache';
import { fetchWithRetryAndTimeout } from './httpUtils';
import { literatureRateLimiter, LiteratureRateLimiter } from './rateLimiter';

export * from './types';
export * from './errors';
export * from './literatureCache';
export * from './httpUtils';
export * from './rateLimiter';

// Configuration for endpoints
const PUBMED_API_BASE = process.env.PUBMED_API_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const CROSSREF_API_BASE = process.env.CROSSREF_API_URL || 'https://api.crossref.org';
const SEMANTIC_SCHOLAR_API_BASE = process.env.SEMANTIC_SCHOLAR_API_URL || 'https://api.semanticscholar.org/graph/v1';

/**
 * PubMed API Wrapper
 * NCBI Policy: max 3 req/s without key, 10 req/s with key.
 * Requires email and tool identifier.
 */
export class PubMedClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private defaultRetries: number;
  private cache: LiteratureCache;
  private rateLimiter: LiteratureRateLimiter;

  constructor(baseUrl: string = PUBMED_API_BASE, options: ClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? (Number(process.env.LITERATURE_API_TIMEOUT_MS) || 10000);
    this.defaultRetries = options.retries ?? 2;
    this.cache = options.cache || literatureCache;
    this.rateLimiter = literatureRateLimiter;
  }

  /**
   * Search PubMed records by keyword or query string with rate limiting, deadline-aware timeout, and caching.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = Math.max(1, Math.min(options.limit || 5, 50));
    const offset = Math.max(0, options.offset || 0);

    // Check cache
    const cacheKey = this.cache.getSearchKey('pubmed', query, options);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const totalTimeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const deadline = Date.now() + totalTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;

    const apiKeyParam = process.env.NCBI_API_KEY ? `&api_key=${encodeURIComponent(process.env.NCBI_API_KEY)}` : '';
    const email = process.env.NCBI_TOOL_EMAIL || 'support@publishai.local';
    const searchUrl = `${this.baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&retstart=${offset}&term=${encodeURIComponent(query)}&tool=publishai&email=${encodeURIComponent(email)}${apiKeyParam}`;

    // Step 1: E-Search (Retrieve PMIDs)
    const searchTimeout = Math.max(1000, deadline - Date.now());
    if (Date.now() >= deadline) {
      throw new TimeoutError(`PubMed search operation exceeded timeout deadline of ${totalTimeoutMs}ms before search`, 'pubmed', totalTimeoutMs);
    }

    const searchRes = await this.rateLimiter.schedule('pubmed', () =>
      fetchWithRetryAndTimeout(searchUrl, {
        headers: { Accept: 'application/json' },
        timeoutMs: searchTimeout,
        retries,
        signal: options.signal,
        source: 'pubmed',
      })
    );

    if (!searchRes.ok) {
      throw new RemoteServerError(
        `PubMed search returned status ${searchRes.status}: ${searchRes.statusText}`,
        searchRes.status,
        'pubmed'
      );
    }

    let searchData: any;
    try {
      searchData = await searchRes.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'PubMed search returned invalid JSON payload',
        searchRes.status,
        'pubmed',
        parseErr
      );
    }

    const ids: string[] = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) {
      // Cache empty result to avoid hammering PubMed
      await this.cache.set(cacheKey, [], options.cacheTtl);
      return [];
    }

    // Step 2: E-Summary (Retrieve article details by PMIDs)
    const summaryTimeout = Math.max(1000, deadline - Date.now());
    if (Date.now() >= deadline) {
      throw new TimeoutError(`PubMed search operation exceeded timeout deadline of ${totalTimeoutMs}ms before summary fetch`, 'pubmed', totalTimeoutMs);
    }

    const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}&tool=publishai&email=${encodeURIComponent(email)}${apiKeyParam}`;
    const summaryRes = await this.rateLimiter.schedule('pubmed', () =>
      fetchWithRetryAndTimeout(summaryUrl, {
        headers: { Accept: 'application/json' },
        timeoutMs: summaryTimeout,
        retries,
        signal: options.signal,
        source: 'pubmed',
      })
    );

    if (!summaryRes.ok) {
      throw new RemoteServerError(
        `PubMed summary request returned status ${summaryRes.status}: ${summaryRes.statusText}`,
        summaryRes.status,
        'pubmed'
      );
    }

    let summaryData: any;
    try {
      summaryData = await summaryRes.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'PubMed summary returned invalid JSON payload',
        summaryRes.status,
        'pubmed',
        parseErr
      );
    }

    const items: LiteratureItem[] = [];

    for (const id of ids) {
      const item = summaryData.result?.[id];
      if (!item || item.error) continue;

      const authors: Author[] = (item.authors || []).map((a: { name?: string }) => ({
        name: a.name || 'Unknown',
        lastName: a.name?.split(' ')?.[0],
        firstName: a.name?.split(' ')?.[1],
      }));

      const doiObj = item.articleids?.find((aid: { idtype?: string; value?: string }) => aid.idtype === 'doi');
      const pubYear = item.pubdate ? parseInt(item.pubdate.split(' ')[0], 10) : undefined;

      const litItem: LiteratureItem = {
        id: `pubmed-${id}`,
        externalId: id,
        source: 'pubmed',
        title: item.title?.replace(/\[|\]/g, '') || 'Untitled Article',
        authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
        journal: item.source || item.fulljournalname,
        year: !isNaN(pubYear as number) ? pubYear : undefined,
        publicationDate: item.pubdate,
        doi: doiObj?.value,
        volume: item.volume,
        issue: item.issue,
        pages: item.pages,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };

      items.push(litItem);
      // Cache individual article
      await this.cache.set(
        this.cache.getArticleKey('pubmed', id),
        litItem,
        this.cache.getDefaultArticleTtl()
      );
    }

    // Cache search result list
    await this.cache.set(cacheKey, items, options.cacheTtl);
    return items;
  }

  /**
   * Fetch single article details directly by PubMed ID using esummary.
   */
  async getById(pubmedId: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    const cleanId = pubmedId.trim().replace(/^pubmed-/i, '');
    if (!cleanId) return null;

    // Check cache
    const cacheKey = this.cache.getArticleKey('pubmed', cleanId);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;
    const apiKeyParam = process.env.NCBI_API_KEY ? `&api_key=${encodeURIComponent(process.env.NCBI_API_KEY)}` : '';
    const email = process.env.NCBI_TOOL_EMAIL || 'support@publishai.local';
    const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(cleanId)}&tool=publishai&email=${encodeURIComponent(email)}${apiKeyParam}`;

    const res = await this.rateLimiter.schedule('pubmed', () =>
      fetchWithRetryAndTimeout(summaryUrl, {
        headers: { Accept: 'application/json' },
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'pubmed',
      })
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new RemoteServerError(
        `PubMed lookup returned status ${res.status}: ${res.statusText}`,
        res.status,
        'pubmed'
      );
    }

    let summaryData: any;
    try {
      summaryData = await res.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'PubMed lookup returned invalid JSON payload',
        res.status,
        'pubmed',
        parseErr
      );
    }

    const item = summaryData.result?.[cleanId];
    if (!item || item.error) {
      return null;
    }

    const authors: Author[] = (item.authors || []).map((a: { name?: string }) => ({
      name: a.name || 'Unknown',
      lastName: a.name?.split(' ')?.[0],
      firstName: a.name?.split(' ')?.[1],
    }));

    const doiObj = item.articleids?.find((aid: { idtype?: string; value?: string }) => aid.idtype === 'doi');
    const pubYear = item.pubdate ? parseInt(item.pubdate.split(' ')[0], 10) : undefined;

    const litItem: LiteratureItem = {
      id: `pubmed-${cleanId}`,
      externalId: cleanId,
      source: 'pubmed',
      title: item.title?.replace(/\[|\]/g, '') || 'Untitled Article',
      authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
      journal: item.source || item.fulljournalname,
      year: !isNaN(pubYear as number) ? pubYear : undefined,
      publicationDate: item.pubdate,
      doi: doiObj?.value,
      volume: item.volume,
      issue: item.issue,
      pages: item.pages,
      url: `https://pubmed.ncbi.nlm.nih.gov/${cleanId}/`,
    };

    await this.cache.set(cacheKey, litItem, this.cache.getDefaultArticleTtl());
    return litItem;
  }
}

/**
 * Crossref API Wrapper
 * Polite pool usage with User-Agent header and rate limiting.
 */
export class CrossrefClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private defaultRetries: number;
  private cache: LiteratureCache;
  private rateLimiter: LiteratureRateLimiter;

  constructor(baseUrl: string = CROSSREF_API_BASE, options: ClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? (Number(process.env.LITERATURE_API_TIMEOUT_MS) || 10000);
    this.defaultRetries = options.retries ?? 2;
    this.cache = options.cache || literatureCache;
    this.rateLimiter = literatureRateLimiter;
  }

  /**
   * Search Crossref metadata registry with caching, timeout, and retry support.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = Math.max(1, Math.min(options.limit || 5, 50));
    const offset = Math.max(0, options.offset || 0);

    // Check cache
    const cacheKey = this.cache.getSearchKey('crossref', query, options);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;
    const mailto = process.env.CROSSREF_MAILTO || 'support@publishai.local';

    const url = `${this.baseUrl}/works?query=${encodeURIComponent(query)}&rows=${limit}&offset=${offset}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': `PublishAI/0.1.0 (mailto:${mailto})`,
    };

    if (process.env.CROSSREF_PLUS_API_TOKEN) {
      headers['Crossref-Plus-API-Token'] = `Bearer ${process.env.CROSSREF_PLUS_API_TOKEN}`;
    }

    const res = await this.rateLimiter.schedule('crossref', () =>
      fetchWithRetryAndTimeout(url, {
        headers,
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'crossref',
      })
    );

    if (!res.ok) {
      throw new RemoteServerError(
        `Crossref search returned status ${res.status}: ${res.statusText}`,
        res.status,
        'crossref'
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'Crossref search returned invalid JSON payload',
        res.status,
        'crossref',
        parseErr
      );
    }

    const items = data.message?.items || [];

    const parsedItems: LiteratureItem[] = items.map((work: any) => {
      const authors: Author[] = (work.author || []).map((a: any) => ({
        firstName: a.given,
        lastName: a.family,
        name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown',
      }));

      const year = work.published?.['date-parts']?.[0]?.[0] || work['created']?.['date-parts']?.[0]?.[0];

      return {
        id: `crossref-${work.DOI}`,
        externalId: work.DOI,
        source: 'crossref' as const,
        title: Array.isArray(work.title) ? work.title[0] : (work.title || 'Untitled Work'),
        authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
        journal: Array.isArray(work['container-title']) ? work['container-title'][0] : work['container-title'],
        year: typeof year === 'number' ? year : undefined,
        doi: work.DOI,
        abstract: work.abstract?.replace(/<[^>]*>?/gm, ''),
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
        citationCount: work['is-referenced-by-count'],
      };
    });

    // Cache individual articles by DOI
    for (const item of parsedItems) {
      if (item.doi) {
        await this.cache.set(
          this.cache.getArticleKey('crossref', item.doi),
          item,
          this.cache.getDefaultArticleTtl()
        );
      }
    }

    // Cache search result list
    await this.cache.set(cacheKey, parsedItems, options.cacheTtl);
    return parsedItems;
  }

  /**
   * Fetch single work details directly by DOI using the dedicated Crossref work endpoint.
   */
  async getByDoi(doi: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '');
    if (!cleanDoi) return null;

    // Check cache
    const cacheKey = this.cache.getArticleKey('crossref', cleanDoi);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;
    const mailto = process.env.CROSSREF_MAILTO || 'support@publishai.local';

    const url = `${this.baseUrl}/works/${encodeURIComponent(cleanDoi)}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': `PublishAI/0.1.0 (mailto:${mailto})`,
    };

    if (process.env.CROSSREF_PLUS_API_TOKEN) {
      headers['Crossref-Plus-API-Token'] = `Bearer ${process.env.CROSSREF_PLUS_API_TOKEN}`;
    }

    const res = await this.rateLimiter.schedule('crossref', () =>
      fetchWithRetryAndTimeout(url, {
        headers,
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'crossref',
      })
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new RemoteServerError(
        `Crossref lookup returned status ${res.status}: ${res.statusText}`,
        res.status,
        'crossref'
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'Crossref lookup returned invalid JSON payload',
        res.status,
        'crossref',
        parseErr
      );
    }

    const work = data.message;
    if (!work) return null;

    const authors: Author[] = (work.author || []).map((a: any) => ({
      firstName: a.given,
      lastName: a.family,
      name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown',
    }));

    const year = work.published?.['date-parts']?.[0]?.[0] || work['created']?.['date-parts']?.[0]?.[0];

    const litItem: LiteratureItem = {
      id: `crossref-${work.DOI || cleanDoi}`,
      externalId: work.DOI || cleanDoi,
      source: 'crossref',
      title: Array.isArray(work.title) ? work.title[0] : (work.title || 'Untitled Work'),
      authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
      journal: Array.isArray(work['container-title']) ? work['container-title'][0] : work['container-title'],
      year: typeof year === 'number' ? year : undefined,
      doi: work.DOI || cleanDoi,
      abstract: work.abstract?.replace(/<[^>]*>?/gm, ''),
      volume: work.volume,
      issue: work.issue,
      pages: work.page,
      url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
      citationCount: work['is-referenced-by-count'],
    };

    await this.cache.set(cacheKey, litItem, this.cache.getDefaultArticleTtl());
    return litItem;
  }
}

/**
 * Semantic Scholar API Wrapper
 * Rate Limit: 1 req/s without key, 10 req/s with SEMANTIC_SCHOLAR_API_KEY.
 * Replaces arXiv preprints by fetching peer-reviewed and preprint metadata with high reliability.
 */
export class SemanticScholarClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private defaultRetries: number;
  private cache: LiteratureCache;
  private rateLimiter: LiteratureRateLimiter;

  constructor(baseUrl: string = SEMANTIC_SCHOLAR_API_BASE, options: ClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? (Number(process.env.LITERATURE_API_TIMEOUT_MS) || 10000);
    this.defaultRetries = options.retries ?? 2;
    this.cache = options.cache || literatureCache;
    this.rateLimiter = literatureRateLimiter;
  }

  /**
   * Search Semantic Scholar metadata registry.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = Math.max(1, Math.min(options.limit || 5, 50));
    const offset = Math.max(0, options.offset || 0);

    // Check cache
    const cacheKey = this.cache.getSearchKey('semanticscholar', query, options);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;

    const fields = 'paperId,title,authors,year,publicationDate,externalIds,abstract,venue,citationCount,journal';
    const url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}&fields=${fields}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    const res = await this.rateLimiter.schedule('semanticscholar', () =>
      fetchWithRetryAndTimeout(url, {
        headers,
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'semanticscholar',
      })
    );

    if (!res.ok) {
      throw new RemoteServerError(
        `Semantic Scholar search returned status ${res.status}: ${res.statusText}`,
        res.status,
        'semanticscholar'
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'Semantic Scholar search returned invalid JSON payload',
        res.status,
        'semanticscholar',
        parseErr
      );
    }

    const items = data.data || [];

    const parsedItems: LiteratureItem[] = items.map((paper: any) => {
      const authors: Author[] = (paper.authors || []).map((a: any) => ({
        name: a.name || 'Unknown',
        lastName: a.name?.split(' ')?.slice(-1)[0],
        firstName: a.name?.split(' ')?.slice(0, -1).join(' '),
      }));

      const doi = paper.externalIds?.DOI;

      return {
        id: `semanticscholar-${paper.paperId}`,
        externalId: paper.paperId,
        source: 'semanticscholar' as const,
        title: paper.title || 'Untitled Work',
        authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
        journal: paper.journal?.name || paper.venue,
        year: paper.year || undefined,
        publicationDate: paper.publicationDate,
        doi,
        abstract: paper.abstract || undefined,
        url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${paper.paperId}`,
        citationCount: paper.citationCount,
      };
    });

    // Cache individual items
    for (const item of parsedItems) {
      await this.cache.set(
        this.cache.getArticleKey('semanticscholar', item.externalId),
        item,
        this.cache.getDefaultArticleTtl()
      );
    }

    // Cache search result list
    await this.cache.set(cacheKey, parsedItems, options.cacheTtl);
    return parsedItems;
  }

  /**
   * Fetch single work details directly by Semantic Scholar ID or identifier (e.g. DOI, CorpusId).
   */
  async getById(id: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    const cleanId = id.trim().replace(/^semanticscholar-/i, '');
    if (!cleanId) return null;

    // Check cache
    const cacheKey = this.cache.getArticleKey('semanticscholar', cleanId);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;

    const fields = 'paperId,title,authors,year,publicationDate,externalIds,abstract,venue,citationCount,journal';
    const url = `${this.baseUrl}/paper/${encodeURIComponent(cleanId)}?fields=${fields}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    const res = await this.rateLimiter.schedule('semanticscholar', () =>
      fetchWithRetryAndTimeout(url, {
        headers,
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'semanticscholar',
      })
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new RemoteServerError(
        `Semantic Scholar lookup returned status ${res.status}: ${res.statusText}`,
        res.status,
        'semanticscholar'
      );
    }

    let paper: any;
    try {
      paper = await res.json();
    } catch (parseErr) {
      throw new RemoteServerError(
        'Semantic Scholar lookup returned invalid JSON payload',
        res.status,
        'semanticscholar',
        parseErr
      );
    }

    if (!paper || !paper.paperId) return null;

    const authors: Author[] = (paper.authors || []).map((a: any) => ({
      name: a.name || 'Unknown',
      lastName: a.name?.split(' ')?.slice(-1)[0],
      firstName: a.name?.split(' ')?.slice(0, -1).join(' '),
    }));

    const doi = paper.externalIds?.DOI;

    const litItem: LiteratureItem = {
      id: `semanticscholar-${paper.paperId}`,
      externalId: paper.paperId,
      source: 'semanticscholar',
      title: paper.title || 'Untitled Work',
      authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
      journal: paper.journal?.name || paper.venue,
      year: paper.year || undefined,
      publicationDate: paper.publicationDate,
      doi,
      abstract: paper.abstract || undefined,
      url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${paper.paperId}`,
      citationCount: paper.citationCount,
    };

    await this.cache.set(cacheKey, litItem, this.cache.getDefaultArticleTtl());
    return litItem;
  }
}

/**
 * Unified Literature & Citation Service
 * Coordinates PubMed, Crossref, and Semantic Scholar with concurrent deduplicated search,
 * rate limit defense, multi-tier caching, and citation export.
 */
export class LiteratureService {
  private pubmed: PubMedClient;
  private crossref: CrossrefClient;
  private semanticScholar: SemanticScholarClient;
  private cache: LiteratureCache;

  constructor(
    pubmedClient?: PubMedClient,
    crossrefClient?: CrossrefClient,
    semanticScholarClient?: SemanticScholarClient,
    cache?: LiteratureCache
  ) {
    this.cache = cache || literatureCache;
    this.pubmed = pubmedClient || new PubMedClient(PUBMED_API_BASE, { cache: this.cache });
    this.crossref = crossrefClient || new CrossrefClient(CROSSREF_API_BASE, { cache: this.cache });
    this.semanticScholar = semanticScholarClient || new SemanticScholarClient(SEMANTIC_SCHOLAR_API_BASE, { cache: this.cache });
  }

  /**
   * Unified search querying PubMed, Crossref, and Semantic Scholar concurrently,
   * strictly avoiding arXiv (arXiv queries are redirected/replaced by PubMed/Semantic Scholar),
   * deduplicating records by DOI and normalized title, with caching and resilient error handling.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureSearchResult> {
    const cacheKey = this.cache.getSearchKey('unified', query, options);

    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureSearchResult>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // Determine sources to query (default: all three, arXiv is strictly disallowed)
    let requestedSources = options.sources || ['pubmed', 'crossref', 'semanticscholar'];
    
    // Explicit arXiv check: Replace any 'arxiv' request with PubMed and Semantic Scholar
    if ((requestedSources as any[]).includes('arxiv')) {
      console.warn('[LiteratureService] arXiv requested but prohibited. Replaced with PubMed and Semantic Scholar.');
      requestedSources = requestedSources.filter((s: any) => s !== 'arxiv');
      if (!requestedSources.includes('pubmed')) requestedSources.push('pubmed');
      if (!requestedSources.includes('semanticscholar')) requestedSources.push('semanticscholar');
    }

    // Execute concurrently with Promise.allSettled for fault isolation
    const searchPromises: Promise<{ source: LiteratureSource; items: LiteratureItem[] }>[] = [];

    if (requestedSources.includes('pubmed')) {
      searchPromises.push(
        this.pubmed.search(query, options).then(items => ({ source: 'pubmed' as const, items }))
      );
    }
    if (requestedSources.includes('crossref')) {
      searchPromises.push(
        this.crossref.search(query, options).then(items => ({ source: 'crossref' as const, items }))
      );
    }
    if (requestedSources.includes('semanticscholar')) {
      searchPromises.push(
        this.semanticScholar.search(query, options).then(items => ({ source: 'semanticscholar' as const, items }))
      );
    }

    const settledResults = await Promise.allSettled(searchPromises);

    const sourceCounts = {
      pubmed: 0,
      crossref: 0,
      semanticscholar: 0,
    };
    const errors: Record<string, string> = {};
    const allItems: LiteratureItem[] = [];

    settledResults.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        const { source, items } = res.value;
        sourceCounts[source] = items.length;
        allItems.push(...items);
      } else {
        const errorReason = res.reason?.message || 'External search failed';
        // Map index back to source
        const src = requestedSources[index] || 'unknown';
        errors[src] = errorReason;
        console.warn(`[LiteratureService] Error searching ${src}:`, res.reason);
      }
    });

    // If all failed and throwOnError is requested, throw combined error
    const allFailed = settledResults.every(r => r.status === 'rejected');
    if (allFailed && options.throwOnError) {
      throw new LiteratureApiError(
        `All literature search sources failed: ${JSON.stringify(errors)}`,
        {
          source: 'literature_service',
          details: errors,
        }
      );
    }

    // Deduplicate by DOI and normalized title
    const combined: LiteratureItem[] = [];
    const seenDois = new Set<string>();
    const seenTitles = new Set<string>();

    for (const item of allItems) {
      const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      let duplicate = false;

      if (item.doi && seenDois.has(item.doi.toLowerCase())) {
        duplicate = true;
      } else if (normalizedTitle && seenTitles.has(normalizedTitle)) {
        duplicate = true;
      }

      if (!duplicate) {
        if (item.doi) seenDois.add(item.doi.toLowerCase());
        if (normalizedTitle) seenTitles.add(normalizedTitle);
        combined.push(item);
      }
    }

    const result: LiteratureSearchResult = {
      query,
      total: combined.length,
      items: combined,
      sources: sourceCounts,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
    };

    // Cache results if at least one source succeeded or if items were found
    if (combined.length > 0 || !allFailed) {
      await this.cache.set(cacheKey, result, options.cacheTtl);
    }

    return result;
  }

  /**
   * Fetch a single work by DOI directly (tries Crossref first, then Semantic Scholar fallback).
   */
  async getByDoi(doi: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    try {
      const item = await this.crossref.getByDoi(doi, options);
      if (item) return item;
    } catch (err) {
      console.warn(`[LiteratureService] Crossref getByDoi failed for ${doi}, falling back to Semantic Scholar:`, err);
    }

    return this.semanticScholar.getById(doi, options);
  }

  /**
   * Fetch an article by ID from PubMed, Crossref, or Semantic Scholar.
   * If an arXiv ID is provided, it is replaced and queried via Semantic Scholar (ARXIV:{id}).
   */
  async getById(id: string, source: LiteratureSource | 'arxiv', options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    if (source === 'arxiv') {
      console.warn(`[LiteratureService] Direct arXiv query for ${id} redirected to Semantic Scholar.`);
      const cleanArxiv = id.replace(/^arxiv:/i, '');
      return this.semanticScholar.getById(`ARXIV:${cleanArxiv}`, options);
    }

    if (source === 'pubmed') {
      return this.pubmed.getById(id, options);
    }

    if (source === 'semanticscholar') {
      return this.semanticScholar.getById(id, options);
    }

    return this.crossref.getByDoi(id, options);
  }

  /**
   * Clear all cached literature entries.
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Format a LiteratureItem into a standard citation style string.
   */
  formatCitation(item: LiteratureItem, style: CitationStyle = 'apa'): string {
    const authorStr = this.formatAuthors(item.authors, style);
    const yearStr = item.year ? `(${item.year})` : '(n.d.)';
    const title = item.title.endsWith('.') ? item.title : `${item.title}.`;
    const journal = item.journal ? `*${item.journal}*` : '';
    const doiStr = item.doi ? `https://doi.org/${item.doi}` : (item.url || '');

    switch (style) {
      case 'apa':
        return `${authorStr} ${yearStr}. ${title} ${journal}${item.volume ? `, ${item.volume}` : ''}${item.pages ? `, ${item.pages}` : ''}. ${doiStr}`.trim();
      case 'mla':
        return `${authorStr}. "${title}" ${journal}${item.volume ? ` vol. ${item.volume}` : ''}${item.year ? `, ${item.year}` : ''}${item.pages ? `, pp. ${item.pages}` : ''}. ${doiStr}`.trim();
      case 'chicago':
        return `${authorStr}. "${title}" ${journal} ${item.volume || ''} (${item.year || 'n.d.'}): ${item.pages || ''}. ${doiStr}`.trim();
      case 'harvard':
        return `${authorStr}, ${item.year || 'n.d.'}. ${title} ${journal}${item.volume ? `, ${item.volume}` : ''}, pp.${item.pages || 'n/a'}. Available at: ${doiStr}`.trim();
      case 'bibtex':
        return this.toBibTeX(item);
      default:
        return `${authorStr} ${yearStr}. ${title} ${journal}. ${doiStr}`.trim();
    }
  }

  /**
   * Format author lists according to citation conventions.
   */
  private formatAuthors(authors: Author[], style: CitationStyle): string {
    if (!authors || authors.length === 0) return 'Unknown Author';

    if (style === 'apa') {
      if (authors.length === 1) return authors[0].name;
      if (authors.length === 2) return `${authors[0].name} & ${authors[1].name}`;
      return `${authors[0].name} et al.`;
    }

    if (style === 'mla') {
      if (authors.length === 1) return authors[0].name;
      if (authors.length === 2) return `${authors[0].name}, and ${authors[1].name}`;
      return `${authors[0].name}, et al.`;
    }

    return authors.map(a => a.name).join(', ');
  }

  /**
   * Convert LiteratureItem to BibTeX entry.
   */
  private toBibTeX(item: LiteratureItem): string {
    const key = (item.authors[0]?.lastName || 'ref') + (item.year || 'unknown');
    return `@article{${key},
  author = {${item.authors.map(a => a.name).join(' and ')}},
  title = {${item.title}},
  journal = {${item.journal || 'Unknown Journal'}},
  year = {${item.year || ''}},
  doi = {${item.doi || ''}},
  url = {${item.url || ''}}
}`;
  }

  /**
   * Database persistence hook.
   */
  async saveCitation(_paperId: string, _citation: LiteratureItem): Promise<{ status: string; message: string }> {
    return {
      status: 'pending_schema',
      message: 'Blocked on final database schema for citations. Persistence will be hooked upon migration.',
    };
  }
}

export const literatureService = new LiteratureService();
