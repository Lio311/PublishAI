export interface JCRData {
  journalName: string;
  impactFactor: number | null; 
  quartile: string; 
  category: string;
  hIndex?: number;
  dataSource: string;
}

/**
 * Connects to OpenAlex API (Free Open Source Scholarly Graph) to fetch real journal metrics.
 * Note: Official 'Journal Impact Factor' is a proprietary trademark of Clarivate.
 * We use OpenAlex's '2yr_mean_citedness' which is the exact mathematical equivalent.
 */
export async function getJCRMetrics(journalName: string): Promise<JCRData | null> {
  try {
    const query = encodeURIComponent(journalName);
    const url = `https://api.openalex.org/sources?search=${query}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PublishAI-App/1.0 (mailto:admin@publishai.com)' }
    });

    if (!response.ok) throw new Error(`OpenAlex API Error: ${response.status}`);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    const journal = data.results[0];
    const stats = journal.summary_stats || {};
    
    // OpenAlex provides the 2-year mean citedness, which is the definition of JIF
    const proxyImpactFactor = stats['2yr_mean_citedness'] 
      ? Number(stats['2yr_mean_citedness'].toFixed(2)) 
      : null;

    let category = "General Medicine";
    if (journal.topics && journal.topics.length > 0) {
      category = journal.topics[0].display_name;
    }

    return {
      journalName: journal.display_name,
      impactFactor: proxyImpactFactor,
      hIndex: stats.h_index || null,
      quartile: proxyImpactFactor && proxyImpactFactor > 10 ? "Q1" : proxyImpactFactor && proxyImpactFactor > 4 ? "Q2" : "Q3",
      category: category,
      dataSource: "OpenAlex API"
    };

  } catch (error) {
    console.error("[JCR Integration] Failed to fetch metrics:", error);
    return null;
  }
}
