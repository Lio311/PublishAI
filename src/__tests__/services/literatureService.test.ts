import {
  PubMedClient,
  CrossrefClient,
  SemanticScholarClient,
  LiteratureService,
  LiteratureRateLimiter,
  RateLimitError,
  TimeoutError,
  parseRetryAfter,
  parseRateLimitReset,
  InMemoryLruCache,
  LiteratureCache,
  LiteratureItem,
} from '@/services/literature';
import { db } from '@/services/db';

// Mock db
jest.mock('@/services/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'mock-citation-uuid-123' }]),
      }),
    }),
  },
}));

describe('Literature Service Audit & Security Suite', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('1. Rate Limiting & External Headers Defense', () => {
    it('should parse integer Retry-After header correctly', () => {
      expect(parseRetryAfter('12')).toBe(12);
      expect(parseRetryAfter('0')).toBe(0);
      expect(parseRetryAfter('invalid')).toBeUndefined();
      expect(parseRetryAfter(null)).toBeUndefined();
    });

    it('should parse HTTP-Date Retry-After header correctly', () => {
      const futureDate = new Date(Date.now() + 15000).toUTCString();
      const seconds = parseRetryAfter(futureDate);
      expect(seconds).toBeGreaterThanOrEqual(10);
      expect(seconds).toBeLessThanOrEqual(20);
    });

    it('should parse RateLimit-Reset and X-Rate-Limit-Interval headers', () => {
      const headers1 = new Headers({ 'ratelimit-reset': '8' });
      expect(parseRateLimitReset(headers1)).toBe(8);

      const headers2 = new Headers({ 'x-rate-limit-interval': '5s' });
      expect(parseRateLimitReset(headers2)).toBe(5);

      const headers3 = new Headers({ 'x-rate-limit-interval': '1m' });
      expect(parseRateLimitReset(headers3)).toBe(60);
    });

    it('should pause rate limiter and throw RateLimitError on HTTP 429 when retries exhausted', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        ok: false,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'retry-after': '3' }),
      } as any);

      const client = new CrossrefClient('https://api.crossref.org', { retries: 0 });
      await expect(client.search('cancer therapy', { skipCache: true })).rejects.toThrow(RateLimitError);
    });

    it('should detect embedded rate limit error in PubMed JSON response and throw RateLimitError', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          error: 'API rate limit exceeded. Please wait or obtain an NCBI API key.',
          esearchresult: { idlist: [] },
        }),
      } as any);

      const client = new PubMedClient('https://eutils.ncbi.nlm.nih.gov/entrez/eutils', { retries: 0 });
      await expect(client.search('genomics', { skipCache: true })).rejects.toThrow(RateLimitError);
    });

    it('should pace requests according to minIntervalMs', async () => {
      const limiter = new LiteratureRateLimiter();
      const timestamps: number[] = [];

      const makeTask = () => async () => {
        timestamps.push(Date.now());
        return true;
      };

      const p1 = limiter.schedule('crossref', makeTask());
      const p2 = limiter.schedule('crossref', makeTask());
      const p3 = limiter.schedule('crossref', makeTask());

      await Promise.all([p1, p2, p3]);

      expect(timestamps.length).toBe(3);
      limiter.reset();
    });
  });

  describe('2. Hardcoded Mock Data Elimination & Real DB Persistence', () => {
    it('should save citation to real database schema via saveCitation', async () => {
      const litService = new LiteratureService();
      const item: LiteratureItem = {
        id: 'crossref-10.1000/182',
        externalId: '10.1000/182',
        source: 'crossref',
        title: 'Managing Information in Academic Publishing',
        authors: [{ name: 'Jane Doe', lastName: 'Doe', firstName: 'Jane' }],
        journal: 'Journal of Scholarly Communication',
        year: 2024,
        doi: '10.1000/182',
        url: 'https://doi.org/10.1000/182',
      };

      const saveRes = await litService.saveCitation(42, item, { documentId: 'doc-uuid-1' });

      expect(saveRes.status).toBe('saved');
      expect(saveRes.id).toBe('mock-citation-uuid-123');
      expect(db.insert).toHaveBeenCalled();
    });

    it('should generate valid BibTeX citations without dummy placeholders', () => {
      const litService = new LiteratureService();
      const item: LiteratureItem = {
        id: 'pubmed-12345',
        externalId: '12345',
        source: 'pubmed',
        title: 'CRISPR Cas9 Gene Editing in Mammalian Cells',
        authors: [
          { name: 'Jennifer Doudna', lastName: 'Doudna' },
          { name: 'Emmanuelle Charpentier', lastName: 'Charpentier' },
        ],
        journal: 'Nature Biotechnology',
        year: 2023,
        doi: '10.1038/nbt.1234',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
      };

      const bibtex = litService.toBibTeX(item);
      expect(bibtex).toContain('@article{doudna2023');
      expect(bibtex).toContain('author = {Jennifer Doudna and Emmanuelle Charpentier}');
      expect(bibtex).toContain('title = {CRISPR Cas9 Gene Editing in Mammalian Cells}');
      expect(bibtex).toContain('journal = {Nature Biotechnology}');
      expect(bibtex).toContain('doi = {10.1038/nbt.1234}');
    });

    it('should format citations in APA, MLA, Chicago, and Harvard styles accurately', () => {
      const litService = new LiteratureService();
      const item: LiteratureItem = {
        id: 'crossref-10.1000/test',
        externalId: '10.1000/test',
        source: 'crossref',
        title: 'Quantum Advantage with Superconducting Qubits',
        authors: [
          { name: 'Alice Smith', lastName: 'Smith' },
          { name: 'Bob Jones', lastName: 'Jones' },
        ],
        journal: 'Physical Review Letters',
        year: 2022,
        volume: '128',
        pages: '100501',
        doi: '10.1000/test',
      };

      const apa = litService.formatCitation(item, 'apa');
      expect(apa).toContain('Alice Smith & Bob Jones');
      expect(apa).toContain('(2022).');
      expect(apa).toContain('*Physical Review Letters*');
      expect(apa).toContain('https://doi.org/10.1000/test');

      const mla = litService.formatCitation(item, 'mla');
      expect(mla).toContain('Alice Smith, and Bob Jones.');
      expect(mla).toContain('"Quantum Advantage with Superconducting Qubits."');

      const chicago = litService.formatCitation(item, 'chicago');
      expect(chicago).toContain('(2022): 100501.');

      const harvard = litService.formatCitation(item, 'harvard');
      expect(harvard).toContain('Available at: https://doi.org/10.1000/test');
    });
  });

  describe('3. Unhandled Timeouts & Signal Abort Defense', () => {
    it('should abort and throw TimeoutError when external API hangs beyond timeoutMs', async () => {
      global.fetch = jest.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              reject(new TimeoutError('Request timed out', 'literature_service', 50));
            });
          }
        });
      });

      const client = new CrossrefClient('https://api.crossref.org', { defaultTimeoutMs: 50, retries: 0 });
      await expect(client.search('quantum computing', { timeoutMs: 50, skipCache: true })).rejects.toThrow(TimeoutError);
    });

    it('should immediately reject queued tasks if abort signal is already aborted', async () => {
      const limiter = new LiteratureRateLimiter();
      const controller = new AbortController();
      controller.abort(new Error('User cancelled operation'));

      await expect(
        limiter.schedule('pubmed', async () => 'ok', { signal: controller.signal })
      ).rejects.toThrow('User cancelled operation');

      limiter.reset();
    });

    it('should reject task in queue if timeout expires while waiting', async () => {
      const limiter = new LiteratureRateLimiter();
      // Pause pubmed for 5000ms
      limiter.pause('pubmed', 5000);

      // Schedule task with 40ms timeout
      await expect(
        limiter.schedule('pubmed', async () => 'ok', { timeoutMs: 40 })
      ).rejects.toThrow(TimeoutError);

      limiter.reset();
    });
  });

  describe('4. Strict arXiv Prohibition & Replacement with PubMed/Semantic Scholar', () => {
    it('should strictly exclude arXiv and replace with PubMed and Semantic Scholar in unified search', async () => {
      const service = new LiteratureService();

      const pubmedSpy = jest.spyOn(service.pubmed, 'search').mockResolvedValue([
        {
          id: 'pubmed-111',
          externalId: '111',
          source: 'pubmed',
          title: 'Deep Learning for Oncology',
          authors: [{ name: 'Researcher A' }],
          year: 2023,
        },
      ]);

      const scholarSpy = jest.spyOn(service.semanticScholar, 'search').mockResolvedValue([
        {
          id: 'semanticscholar-222',
          externalId: '222',
          source: 'semanticscholar',
          title: 'Neural Networks in Radiology',
          authors: [{ name: 'Researcher B' }],
          year: 2024,
        },
      ]);

      const crossrefSpy = jest.spyOn(service.crossref, 'search').mockResolvedValue([]);

      // Pass 'arxiv' as requested source
      const res = await service.search('neural networks in medicine', {
        sources: ['arxiv' as any],
        skipCache: true,
      });

      // arXiv must NOT be called; pubmed and semanticscholar must be queried instead
      expect(pubmedSpy).toHaveBeenCalled();
      expect(scholarSpy).toHaveBeenCalled();
      expect(crossrefSpy).not.toHaveBeenCalled();
      expect(res.items.length).toBe(2);
      expect(res.sources.pubmed).toBe(1);
      expect(res.sources.semanticscholar).toBe(1);
    });

    it('should redirect getById for arxiv IDs to Semantic Scholar using ARXIV:{id}', async () => {
      const service = new LiteratureService();
      const scholarSpy = jest.spyOn(service.semanticScholar, 'getById').mockResolvedValue({
        id: 'semanticscholar-arxiv-2401.12345',
        externalId: '2401.12345',
        source: 'semanticscholar',
        title: 'Attention Mechanisms in Scientific Reasoning',
        authors: [{ name: 'Researcher C' }],
        year: 2024,
      });

      const item = await service.getById('arxiv:2401.12345', 'arxiv');

      expect(scholarSpy).toHaveBeenCalledWith('ARXIV:2401.12345', expect.any(Object));
      expect(item?.title).toBe('Attention Mechanisms in Scientific Reasoning');
    });
  });

  describe('5. Caching & Deduplication', () => {
    it('should evict least-recently-used items when cache capacity is exceeded', () => {
      const cache = new InMemoryLruCache(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' so it becomes recently used
      expect(cache.get('a')).toBe(1);

      // Add 'd' which should evict 'b' (oldest unaccessed)
      cache.set('d', 4);

      expect(cache.get('b')).toBeNull();
      expect(cache.get('a')).toBe(1);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should deduplicate unified search items sharing the same DOI or title', async () => {
      const service = new LiteratureService();

      jest.spyOn(service.pubmed, 'search').mockResolvedValue([
        {
          id: 'pubmed-001',
          externalId: '001',
          source: 'pubmed',
          title: 'Targeting KRAS Mutations in Lung Cancer',
          authors: [{ name: 'Dr. Oncologist' }],
          doi: '10.1056/nejmoa202401',
          year: 2024,
        },
      ]);

      jest.spyOn(service.crossref, 'search').mockResolvedValue([
        {
          id: 'crossref-10.1056/nejmoa202401',
          externalId: '10.1056/nejmoa202401',
          source: 'crossref',
          title: 'Targeting KRAS Mutations in Lung Cancer',
          authors: [{ name: 'Dr. Oncologist' }],
          doi: '10.1056/nejmoa202401',
          year: 2024,
        },
      ]);

      jest.spyOn(service.semanticScholar, 'search').mockResolvedValue([]);

      const result = await service.search('KRAS lung cancer', { skipCache: true });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].doi).toBe('10.1056/nejmoa202401');
    });
  });
});
