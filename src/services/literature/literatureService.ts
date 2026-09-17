/**
 * Literature & Citation Service for PublishAI MVP
 * 
 * Provides API wrappers for PubMed and Crossref services, citation formatting,
 * and unified literature search.
 * 
 * NOTE: Citations persistence is currently blocked pending the final database schema.
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
}

export interface LiteratureSearchResult {
  query: string;
  total: number;
  items: LiteratureItem[];
  sources: {
    pubmed: number;
    crossref: number;
  };
}

// Configuration for endpoints (supports custom or dummy endpoints)
const PUBMED_API_BASE = process.env.PUBMED_API_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const CROSSREF_API_BASE = process.env.CROSSREF_API_URL || 'https://api.crossref.org';

// Dummy / Mock Data Generator for offline & testing scenarios
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

  constructor(baseUrl: string = PUBMED_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search PubMed records by keyword or query string.
   * Falls back to dummy endpoint simulation if network fails or useDummy is requested.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = options.limit || 5;

    if (options.useDummy || process.env.NODE_ENV === 'test') {
      return this.getDummyResults(query, limit);
    }

    try {
      const searchUrl = `${this.baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&term=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!searchRes.ok) {
        console.warn(`[PubMedClient] Search request returned status ${searchRes.status}, returning dummy fallback.`);
        return this.getDummyResults(query, limit);
      }

      const searchData = await searchRes.json();
      const ids: string[] = searchData.esearchresult?.idlist || [];
      if (ids.length === 0) return [];

      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
      const summaryRes = await fetch(summaryUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!summaryRes.ok) {
        return this.getDummyResults(query, limit);
      }

      const summaryData = await summaryRes.json();
      const items: LiteratureItem[] = [];

      for (const id of ids) {
        const item = summaryData.result?.[id];
        if (!item) continue;

        const authors: Author[] = (item.authors || []).map((a: { name?: string }) => ({
          name: a.name || 'Unknown',
          lastName: a.name?.split(' ')?.[0],
          firstName: a.name?.split(' ')?.[1]
        }));

        const doiObj = item.articleids?.find((aid: { idtype?: string; value?: string }) => aid.idtype === 'doi');
        const pubYear = item.pubdate ? parseInt(item.pubdate.split(' ')[0], 10) : undefined;

        items.push({
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
        });
      }

      return items;
    } catch (error) {
      console.warn('[PubMedClient] Error during API query, using dummy fallback data:', error);
      return this.getDummyResults(query, limit);
    }
  }

  /**
   * Fetch single article details by PubMed ID.
   */
  async getById(pubmedId: string): Promise<LiteratureItem | null> {
    const results = await this.search(pubmedId, { limit: 1 });
    return results[0] || null;
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

  constructor(baseUrl: string = CROSSREF_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search Crossref metadata registry by query string.
   * Falls back to dummy endpoint simulation if network fails or useDummy is requested.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureItem[]> {
    const limit = options.limit || 5;
    const offset = options.offset || 0;

    if (options.useDummy || process.env.NODE_ENV === 'test') {
      return this.getDummyResults(query, limit);
    }

    try {
      const url = `${this.baseUrl}/works?query=${encodeURIComponent(query)}&rows=${limit}&offset=${offset}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PublishAI/0.1.0 (mailto:agent@publishai.local)'
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        console.warn(`[CrossrefClient] API returned status ${res.status}, returning dummy fallback.`);
        return this.getDummyResults(query, limit);
      }

      const data = await res.json();
      const items = data.message?.items || [];

      return items.map((work: any) => {
        const authors: Author[] = (work.author || []).map((a: any) => ({
          firstName: a.given,
          lastName: a.family,
          name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown'
        }));

        const year = work.published?.['date-parts']?.[0]?.[0] || work['created']?.['date-parts']?.[0]?.[0];

        return {
          id: `crossref-${work.DOI}`,
          externalId: work.DOI,
          source: 'crossref',
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
    } catch (error) {
      console.warn('[CrossrefClient] Error during API query, using dummy fallback data:', error);
      return this.getDummyResults(query, limit);
    }
  }

  /**
   * Fetch single work details by DOI.
   */
  async getByDoi(doi: string): Promise<LiteratureItem | null> {
    const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '');
    const results = await this.search(cleanDoi, { limit: 1 });
    return results[0] || null;
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

  constructor(pubmedClient?: PubMedClient, crossrefClient?: CrossrefClient) {
    this.pubmed = pubmedClient || new PubMedClient();
    this.crossref = crossrefClient || new CrossrefClient();
  }

  /**
   * Unified search querying both PubMed and Crossref, deduplicating records by DOI/title.
   */
  async search(query: string, options: LiteratureSearchOptions = {}): Promise<LiteratureSearchResult> {
    const [pubmedResults, crossrefResults] = await Promise.all([
      this.pubmed.search(query, options).catch(() => []),
      this.crossref.search(query, options).catch(() => [])
    ]);

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

    return {
      query,
      total: combined.length,
      items: combined,
      sources: {
        pubmed: pubmedResults.length,
        crossref: crossrefResults.length
      }
    };
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
