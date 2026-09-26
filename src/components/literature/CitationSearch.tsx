'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, ExternalLink, X, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Author {
  name: string;
  firstName?: string;
  lastName?: string;
}

interface LiteratureItem {
  id?: string;
  title: string;
  authors?: Author[];
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
  source?: string;
}

interface LiteratureSearchResult {
  query?: string;
  total?: number;
  items?: LiteratureItem[];
  sources?: {
    pubmed?: number;
    crossref?: number;
    semanticscholar?: number;
  };
}

export default function CitationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LiteratureSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = useTranslations('Literature');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Abort any in-flight requests when unmounting
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Abort previous in-flight request if user initiates a new search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(`/api/literature/search?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (res.status === 429) {
          throw new Error(
            t('rateLimit', {
              source: errorData?.source || 'API',
              retryAfter: errorData?.retryAfter || 5,
            })
          );
        }
        if (res.status === 504) {
          throw new Error(t('timeout'));
        }
        throw new Error(errorData?.error || t('fetchFailed'));
      }

      const data = await res.json().catch(() => {
        throw new Error(t('fetchFailed'));
      });

      setResults(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Ignored: request was intentionally cancelled
        return;
      }
      setError(err?.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery('');
    setResults(null);
    setError('');
  };

  const items = Array.isArray(results?.items) ? results.items : [];
  const totalResults = results?.total ?? items.length;

  return (
    <div className="p-6 border border-slate-200 rounded-xl shadow-sm bg-white max-w-4xl mx-auto mt-4 text-start">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-sky-500" />
          {t('title')}
        </h2>
        {(results || query || error) && (
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            {t('clear')}
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            disabled={loading}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-busy={loading}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('searching')}</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>{t('search')}</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 my-4"
        >
          <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">{t('searching')}</p>
        </div>
      )}

      {results && !loading && (
        <div>
          <div className="mb-3 text-sm text-slate-600 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span>
              {t('foundResults', { total: totalResults })}{' '}
              {results.sources && (
                <span className="text-slate-500">
                  (
                  {t('sourcesBreakdown', {
                    pubmed: results.sources.pubmed ?? 0,
                    crossref: results.sources.crossref ?? 0,
                  })}
                  {results.sources.semanticscholar !== undefined
                    ? t('semanticScholarSource', { count: results.sources.semanticscholar })
                    : ''}
                  )
                </span>
              )}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <p className="text-sm text-slate-500">{t('noResults')}</p>
            </div>
          ) : (
            <ul className="space-y-3 mt-4">
              {items.map((item, index) => {
                const doiUrl = item.doi
                  ? item.doi.startsWith('http')
                    ? item.doi
                    : `https://doi.org/${item.doi}`
                  : null;

                return (
                  <li
                    key={item.id || item.doi || index}
                    className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors"
                  >
                    <h3 className="font-semibold text-slate-900 leading-snug">{item.title}</h3>
                    {item.authors && item.authors.length > 0 && (
                      <p className="text-sm text-slate-700 mt-1">
                        {item.authors.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {item.journal && <span>{item.journal}</span>}
                      {item.year && <span className="ml-1">({item.year})</span>}
                    </p>
                    {doiUrl && (
                      <div className="mt-2">
                        <a
                          href={doiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-medium hover:underline"
                        >
                          <span>{item.doi}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
