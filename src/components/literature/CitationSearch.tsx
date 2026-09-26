'use client';

import React, { useState } from 'react';

export default function CitationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(`/api/literature/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (res.status === 429) {
          throw new Error(`Rate limit exceeded (${errorData?.source || 'API'}). Please wait ${errorData?.retryAfter || 5}s before searching again.`);
        }
        if (res.status === 504) {
          throw new Error('Search request timed out. Please try a more specific search term.');
        }
        throw new Error(errorData?.error || 'Failed to fetch literature search results');
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm max-w-4xl mx-auto mt-4">
      <h2 className="text-xl font-bold mb-4">Citation Search</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search PubMed, Crossref & Semantic Scholar..."
          className="flex-1 p-2 border rounded-md"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {results && (
        <div>
          <p className="mb-2 text-sm text-gray-600">
            Found {results.total} results (PubMed: {results.sources?.pubmed ?? 0}, Crossref: {results.sources?.crossref ?? 0}{results.sources?.semanticscholar !== undefined ? `, Semantic Scholar: ${results.sources.semanticscholar}` : ''})
          </p>
          <ul className="space-y-4 mt-4">
            {results.items.map((item: any, index: number) => (
              <li key={index} className="p-4 border rounded-md bg-gray-50">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-700">
                  {item.authors?.map((a: any) => a.name).join(', ')}
                </p>
                <p className="text-sm text-gray-500">
                  {item.journal} {item.year ? `(${item.year})` : ''}
                </p>
                {item.doi && (
                  <a
                    href={`https://doi.org/${item.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline"
                  >
                    {item.doi}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
