import type { JournalMetrics, SimilarWork } from "./types";

/**
 * Thin client for the OpenAlex scholarly graph (https://docs.openalex.org).
 * Used as the factual backbone of journal matching: which venues actually
 * publish work like the manuscript, and what their metrics are.
 */

const OPENALEX_BASE = "https://api.openalex.org";
const REQUEST_TIMEOUT_MS = 15_000;
const RECENT_YEARS = 5;

export class OpenAlexError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OpenAlexError";
  }
}

function withAuthParams(url: URL): URL {
  const mailto = process.env.OPENALEX_MAILTO;
  const apiKey = process.env.OPENALEX_API_KEY;
  if (mailto) url.searchParams.set("mailto", mailto);
  if (apiKey) url.searchParams.set("api_key", apiKey);
  return url;
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = withAuthParams(new URL(path, OPENALEX_BASE));
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "PublishAI-JournalMatcher/1.0" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new OpenAlexError(`OpenAlex ${path} responded ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

/** Commas, pipes and colons are filter-syntax delimiters in OpenAlex and must not appear in values. */
export function sanitizeFilterValue(value: string): string {
  return value.replace(/[,|:!<>"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

export function shortId(openAlexId: string): string {
  return openAlexId.replace("https://openalex.org/", "");
}

function recentDateFilter(): string {
  const year = new Date().getFullYear() - RECENT_YEARS;
  return `from_publication_date:${year}-01-01`;
}

interface GroupByResponse {
  group_by: Array<{ key: string; key_display_name: string; count: number }>;
}

export interface VenueHit {
  id: string;
  name: string;
  count: number;
}

/**
 * Returns the journals that published the most recent articles matching `query`
 * in their title or abstract.
 */
export async function findVenuesForQuery(query: string, limit = 25): Promise<VenueHit[]> {
  const clean = sanitizeFilterValue(query);
  if (!clean) return [];

  const data = await getJson<GroupByResponse>("/works", {
    filter: [
      `title_and_abstract.search:${clean}`,
      "type:article",
      "primary_location.source.type:journal",
      recentDateFilter(),
    ].join(","),
    group_by: "primary_location.source.id",
    per_page: String(limit),
  });

  return (data.group_by || [])
    .filter((g) => g.key && g.key !== "unknown")
    .map((g) => ({ id: shortId(g.key), name: g.key_display_name, count: g.count }));
}

interface OpenAlexSource {
  id: string;
  display_name: string;
  issn_l: string | null;
  host_organization_name: string | null;
  homepage_url: string | null;
  works_count: number;
  summary_stats?: { "2yr_mean_citedness"?: number; h_index?: number };
  is_oa: boolean;
  is_in_doaj: boolean;
  apc_usd: number | null;
  type: string;
  topics?: Array<{ display_name: string }>;
}

const SOURCE_FIELDS =
  "id,display_name,issn_l,host_organization_name,homepage_url,works_count,summary_stats,is_oa,is_in_doaj,apc_usd,type,topics";

export function toJournalMetrics(source: OpenAlexSource): JournalMetrics {
  const citedness = source.summary_stats?.["2yr_mean_citedness"];
  return {
    openAlexId: shortId(source.id),
    name: source.display_name,
    issn: source.issn_l ?? null,
    publisher: source.host_organization_name ?? null,
    homepageUrl: source.homepage_url ?? null,
    worksCount: source.works_count ?? 0,
    citedness2yr: typeof citedness === "number" ? Math.round(citedness * 100) / 100 : null,
    hIndex: source.summary_stats?.h_index ?? null,
    isOpenAccess: Boolean(source.is_oa),
    isInDoaj: Boolean(source.is_in_doaj),
    apcUsd: source.apc_usd ?? null,
    topics: (source.topics || []).slice(0, 5).map((t) => t.display_name),
  };
}

/** Fetches metrics for up to 50 sources in one request. */
export async function getJournalMetrics(ids: string[]): Promise<JournalMetrics[]> {
  const unique = Array.from(new Set(ids.map(shortId))).slice(0, 50);
  if (unique.length === 0) return [];

  const data = await getJson<{ results: OpenAlexSource[] }>("/sources", {
    filter: `openalex:${unique.join("|")}`,
    select: SOURCE_FIELDS,
    per_page: "50",
  });
  return (data.results || []).filter((s) => s.type === "journal").map(toJournalMetrics);
}

export function normalizeJournalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Resolves a journal name (e.g. proposed by the editor agent) to a real OpenAlex
 * journal. Returns null when no confidently matching journal exists, which is how
 * hallucinated titles get filtered out.
 */
export async function resolveJournalByName(name: string): Promise<JournalMetrics | null> {
  const clean = sanitizeFilterValue(name);
  if (!clean) return null;

  const data = await getJson<{ results: OpenAlexSource[] }>("/sources", {
    search: clean,
    filter: "type:journal",
    select: SOURCE_FIELDS,
    per_page: "5",
  });

  const target = normalizeJournalName(name);
  const exact = (data.results || []).find((s) => normalizeJournalName(s.display_name) === target);
  return exact ? toJournalMetrics(exact) : null;
}

/**
 * Recent, topically similar articles from a specific journal: the total count and
 * a few examples shown to the user as evidence.
 */
export async function findSimilarWorksInJournal(
  journalId: string,
  query: string,
  limit = 3
): Promise<{ count: number; works: SimilarWork[] }> {
  const clean = sanitizeFilterValue(query);
  if (!clean) return { count: 0, works: [] };

  const data = await getJson<{
    meta?: { count?: number };
    results: Array<{ display_name?: string; title?: string; publication_year?: number; doi?: string | null }>;
  }>("/works", {
    filter: [`title_and_abstract.search:${clean}`, `primary_location.source.id:${shortId(journalId)}`, recentDateFilter()].join(","),
    select: "display_name,publication_year,doi",
    per_page: String(limit),
  });

  const works = (data.results || [])
    .map((w) => ({
      title: w.display_name || w.title || "",
      year: w.publication_year ?? null,
      doi: w.doi ?? null,
    }))
    .filter((w) => w.title);
  return { count: data.meta?.count ?? works.length, works };
}
