/**
 * Literature & Citation Service for PublishAI
 * 
 * Provides resilient, cached API wrappers for PubMed and Crossref services,
 * citation formatting, configurable timeouts, error categorization, and unified literature search.
 */

import {
  Author,
  CitationStyle,
  ClientOptions,
  LiteratureItem,
  LiteratureSearchOptions,
  LiteratureSearchResult,
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

export * from './types';
export * from './errors';
export * from './literatureCache';
export * from './httpUtils';

// Configuration for endpoints
const PUBMED_API_BASE = process.env.PUBMED_API_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const CROSSREF_API_BASE = process.env.CROSSREF_API_URL || 'https://api.crossref.org';

// Dummy / Mock Data Generator for offline & explicitly requested mock scenarios
export const DUMMY_PUBMED_ARTICLES: LiteratureItem[] = [
  {
    id: 'pubmed-38412345',
    externalId: '38412345',
    source: 'pubmed',
    title: 'Machine learning applications in biomedical literature analysis: A comprehensive survey',
    authors: [
      { firstName: 'Sarah', lastName: 'Chen', name: 'Sarah Chen' },
      { firstName: 'Marcus', lastName: 'Vance', name: 'Marcus Vance' },
      { firstName: 'Elena', lastName: 'Rostova', name: 'Elena Rostova' }
    ],
    journal: 'Journal of Biomedical Informatics',
    year: 2025,
    publicationDate: '2025-02-15',
    doi: '10.1016/j.jbi.2025.104521',
    abstract: 'Artificial intelligence and large language models are transforming biomedical literature mining, synthesis, and evidence-based medicine workflows.',
    volume: '150',
    pages: '104521',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38412345/',
    citationCount: 42
  },
  {
    id: 'pubmed-37987654',
    externalId: '37987654',
    source: 'pubmed',
    title: 'Automated citation extraction and graph-based validation in scientific publishing',
    authors: [
      { firstName: 'David', lastName: 'Kim', name: 'David Kim' },
      { firstName: 'Amina', lastName: 'Al-Mansoor', name: 'Amina Al-Mansoor' }
    ],
    journal: 'Nature Machine Intelligence',
    year: 2024,
    publicationDate: '2024-11-10',
    doi: '10.1038/s42256-024-00892-1',
    abstract: 'We present a framework for real-time verification of scientific citations against global literature registries using neural embeddings and knowledge graphs.',
    volume: '6',
    issue: '11',
    pages: '1240-1252',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37987654/',
    citationCount: 88
  }
];

export const DUMMY_CROSSREF_WORKS: LiteratureItem[] = [
  {
    id: 'crossref-10.1145/3544548.3581388',
    externalId: '10.1145/3544548.3581388',
    source: 'crossref',
    title: 'Towards verifiable AI-assisted academic writing and citation provenance',
    authors: [
      { firstName: 'Julian', lastName: 'Thorne', name: 'Julian Thorne' },
      { firstName: 'Lara', lastName: 'Croft', name: 'Lara Croft' }
    ],
    journal: 'ACM Transactions on Computer-Human Interaction',
    year: 2024,
    publicationDate: '2024-04-20',
    doi: '10.1145/3544548.3581388',
    abstract: 'Investigating how co-writing interfaces can maintain rigor, audit trails, and faithful bibliographic links when drafting complex scientific manuscripts.',
    volume: '31',
    issue: '2',
    pages: '1-28',
    url: 'https://doi.org/10.1145/3544548.3581388',
    citationCount: 19
  },
  {
    id: 'crossref-10.1007/s11192-023-04812-x',
    externalId: '10.1007/s11192-023-04812-x',
    source: 'crossref',
    title: 'Bibliometric analysis of preprint citation drift in peer-reviewed journals',
    authors: [
      { firstName: 'Oliver', lastName: 'Smith', name: 'Oliver Smith' },
      { firstName: 'Beatriz', lastName: 'Navarro', name: 'Beatriz Navarro' }
    ],
    journal: 'Scientometrics',
    year: 2023,
    publicationDate: '2023-09-05',
    doi: '10.1007/s11192-023-04812-x',
    abstract: 'An empirical evaluation of metadata stability, author attribution, and DOI persistence between preprint archives and final publisher records.',
    volume: '128',
    issue: '9',
    pages: '5123-5145',
    url: 'https://doi.org/10.1007/s11192-023-04812-x',
    citationCount: 35
  }
];

/**
 * PubMed API Wrapper
 */
export class PubMedClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private defaultRetries: number;
  private cache: LiteratureCache;

  constructor(baseUrl: string = PUBMED_API_BASE, options: ClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? (Number(process.env.LITERATURE_API_TIMEOUT_MS) || 10000);
    this.defaultRetries = options.retries ?? 2;
    this.cache = options.cache || literatureCache;
  }

  /**
   * Search PubMed records by keyword or query string with caching, timeout, and retry support.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = options.limit || 5;
    const offset = options.offset || 0;

    if (options.useDummy) {
      return this.getDummyResults(query, limit);
    }

    // Check cache
    const cacheKey = this.cache.getSearchKey('pubmed', query, options);
    if (!options.skipCache) {
      const cached = await this.cache.get<LiteratureItem[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const retries = options.retries ?? this.defaultRetries;

    try {
      const apiKeyParam = process.env.NCBI_API_KEY ? `&api_key=${encodeURIComponent(process.env.NCBI_API_KEY)}` : '';
      const searchUrl = `${this.baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&retstart=${offset}&term=${encodeURIComponent(query)}&tool=publishai&email=support@publishai.local${apiKeyParam}`;

      const searchRes = await fetchWithRetryAndTimeout(searchUrl, {
        headers: { 'Accept': 'application/json' },
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'pubmed',
      });

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

      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}&tool=publishai&email=support@publishai.local${apiKeyParam}`;
      const summaryRes = await fetchWithRetryAndTimeout(summaryUrl, {
        headers: { 'Accept': 'application/json' },
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'pubmed',
      });

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
          firstName: a.name?.split(' ')?.[1]
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
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
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
    } catch (error: any) {
      console.error('[PubMedClient] Error during PubMed query:', error);
      throw error;
    }
  }

  /**
   * Fetch single article details directly by PubMed ID using esummary (avoids redundant esearch).
   */
  async getById(pubmedId: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    const cleanId = pubmedId.trim().replace(/^pubmed-/i, '');
    if (!cleanId) return null;

    if (options.useDummy) {
      const match = DUMMY_PUBMED_ARTICLES.find(a => a.externalId === cleanId);
      return match || null;
    }

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

    try {
      const apiKeyParam = process.env.NCBI_API_KEY ? `&api_key=${encodeURIComponent(process.env.NCBI_API_KEY)}` : '';
      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(cleanId)}&tool=publishai&email=support@publishai.local${apiKeyParam}`;

      const res = await fetchWithRetryAndTimeout(summaryUrl, {
        headers: { 'Accept': 'application/json' },
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'pubmed',
      });

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

      const summaryData = await res.json();
      const item = summaryData.result?.[cleanId];

      if (!item || item.error) {
        return null;
      }

      const authors: Author[] = (item.authors || []).map((a: { name?: string }) => ({
        name: a.name || 'Unknown',
        lastName: a.name?.split(' ')?.[0],
        firstName: a.name?.split(' ')?.[1]
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
        url: `https://pubmed.ncbi.nlm.nih.gov/${cleanId}/`
      };

      await this.cache.set(cacheKey, litItem, this.cache.getDefaultArticleTtl());
      return litItem;
    } catch (error) {
      console.error(`[PubMedClient] Error looking up PubMed ID ${cleanId}:`, error);
      throw error;
    }
  }

  private getDummyResults(query: string, limit: number): LiteratureItem[] {
    const normalized = query.toLowerCase();
    const matches = DUMMY_PUBMED_ARTICLES.filter(art => 
      art.title.toLowerCase().includes(normalized) ||
      art.abstract?.toLowerCase().includes(normalized) ||
      art.authors.some(a => a.name.toLowerCase().includes(normalized))
    );

    const pool = matches.length > 0 ? matches : DUMMY_PUBMED_ARTICLES;
    return pool.slice(0, limit);
  }
}

/**
 * Crossref API Wrapper
 */
export class CrossrefClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private defaultRetries: number;
  private cache: LiteratureCache;

  constructor(baseUrl: string = CROSSREF_API_BASE, options: ClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? (Number(process.env.LITERATURE_API_TIMEOUT_MS) || 10000);
    this.defaultRetries = options.retries ?? 2;
    this.cache = options.cache || literatureCache;
  }

  /**
   * Search Crossref metadata registry with caching, timeout, and retry support.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = options.limit || 5;
    const offset = options.offset || 0;

    if (options.useDummy) {
      return this.getDummyResults(query, limit);
    }

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

    try {
      const url = `${this.baseUrl}/works?query=${encodeURIComponent(query)}&rows=${limit}&offset=${offset}`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'PublishAI/0.1.0 (mailto:support@publishai.local)'
      };

      if (process.env.CROSSREF_PLUS_API_TOKEN) {
        headers['Crossref-Plus-API-Token'] = `Bearer ${process.env.CROSSREF_PLUS_API_TOKEN}`;
      }

      const res = await fetchWithRetryAndTimeout(url, {
        headers,
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'crossref',
      });

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
          name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown'
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
          citationCount: work['is-referenced-by-count']
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
    } catch (error: any) {
      console.error('[CrossrefClient] Error during Crossref query:', error);
      throw error;
    }
  }

  /**
   * Fetch single work details directly by DOI using the dedicated Crossref work endpoint.
   */
  async getByDoi(doi: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '');
    if (!cleanDoi) return null;

    if (options.useDummy) {
      const match = DUMMY_CROSSREF_WORKS.find(w => w.doi?.toLowerCase() === cleanDoi.toLowerCase());
      return match || null;
    }

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

    try {
      const url = `${this.baseUrl}/works/${encodeURIComponent(cleanDoi)}`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'PublishAI/0.1.0 (mailto:support@publishai.local)'
      };

      if (process.env.CROSSREF_PLUS_API_TOKEN) {
        headers['Crossref-Plus-API-Token'] = `Bearer ${process.env.CROSSREF_PLUS_API_TOKEN}`;
      }

      const res = await fetchWithRetryAndTimeout(url, {
        headers,
        timeoutMs,
        retries,
        signal: options.signal,
        source: 'crossref',
      });

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
        name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown'
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
        citationCount: work['is-referenced-by-count']
      };

      await this.cache.set(cacheKey, litItem, this.cache.getDefaultArticleTtl());
      return litItem;
    } catch (error) {
      console.error(`[CrossrefClient] Error looking up DOI ${cleanDoi}:`, error);
      throw error;
    }
  }

  private getDummyResults(query: string, limit: number): LiteratureItem[] {
    const normalized = query.toLowerCase();
    const matches = DUMMY_CROSSREF_WORKS.filter(work =>
      work.title.toLowerCase().includes(normalized) ||
      work.doi?.toLowerCase().includes(normalized) ||
      work.abstract?.toLowerCase().includes(normalized) ||
      work.authors.some(a => a.name.toLowerCase().includes(normalized))
    );

    const pool = matches.length > 0 ? matches : DUMMY_CROSSREF_WORKS;
    return pool.slice(0, limit);
  }
}

/**
 * Unified Literature & Citation Service
 */
export class LiteratureService {
  private pubmed: PubMedClient;
  private crossref: CrossrefClient;
  private cache: LiteratureCache;

  constructor(
    pubmedClient?: PubMedClient,
    crossrefClient?: CrossrefClient,
    cache?: LiteratureCache
  ) {
    this.cache = cache || literatureCache;
    this.pubmed = pubmedClient || new PubMedClient(PUBMED_API_BASE, { cache: this.cache });
    this.crossref = crossrefClient || new CrossrefClient(CROSSREF_API_BASE, { cache: this.cache });
  }

  /**
   * Unified search querying both PubMed and Crossref concurrently,
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

    // Execute concurrently with Promise.allSettled for fault isolation
    const [pubmedSettled, crossrefSettled] = await Promise.allSettled([
      this.pubmed.search(query, options),
      this.crossref.search(query, options)
    ]);

    let pubmedResults: LiteratureItem[] = [];
    let crossrefResults: LiteratureItem[] = [];
    let pubmedError: string | undefined;
    let crossrefError: string | undefined;

    if (pubmedSettled.status === 'fulfilled') {
      pubmedResults = pubmedSettled.value;
    } else {
      pubmedError = pubmedSettled.reason?.message || 'PubMed search failed';
      console.warn('[LiteratureService] PubMed search error:', pubmedSettled.reason);
    }

    if (crossrefSettled.status === 'fulfilled') {
      crossrefResults = crossrefSettled.value;
    } else {
      crossrefError = crossrefSettled.reason?.message || 'Crossref search failed';
      console.warn('[LiteratureService] Crossref search error:', crossrefSettled.reason);
    }

    // If both failed and throwOnError is requested, throw combined error
    if (pubmedSettled.status === 'rejected' && crossrefSettled.status === 'rejected' && options.throwOnError) {
      throw new LiteratureApiError(
        `All literature search sources failed: PubMed (${pubmedError}), Crossref (${crossrefError})`,
        {
          source: 'literature_service',
          details: { pubmed: pubmedError, crossref: crossrefError }
        }
      );
    }

    const combined: LiteratureItem[] = [];
    const seenDois = new Set<string>();
    const seenTitles = new Set<string>();

    for (const item of [...pubmedResults, ...crossrefResults]) {
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
      sources: {
        pubmed: pubmedResults.length,
        crossref: crossrefResults.length
      },
      ...(pubmedError || crossrefError ? {
        errors: {
          ...(pubmedError ? { pubmed: pubmedError } : {}),
          ...(crossrefError ? { crossref: crossrefError } : {})
        }
      } : {})
    };

    // Cache results if at least one source succeeded or if items were found
    if (combined.length > 0 || (!pubmedError && !crossrefError)) {
      await this.cache.set(cacheKey, result, options.cacheTtl);
    }

    return result;
  }

  /**
   * Fetch a single work by DOI directly.
   */
  async getByDoi(doi: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    return this.crossref.getByDoi(doi, options);
  }

  /**
   * Fetch an article by ID from PubMed or Crossref.
   */
  async getById(id: string, source: 'pubmed' | 'crossref', options: LiteratureSearchOptions = {}): Promise<LiteratureItem | null> {
    if (source === 'pubmed') {
      return this.pubmed.getById(id, options);
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
   * Database persistence hook:
   * Blocked on final DB schema for citations from Database Agent.
   */
  async saveCitation(_paperId: string, _citation: LiteratureItem): Promise<{ status: string; message: string }> {
    return {
      status: 'pending_schema',
      message: 'Blocked on final database schema for citations. Persistence will be hooked upon migration.'
    };
  }
}

export const literatureService = new LiteratureService();
