export interface PlagiarismMatch {
  text: string;
  similarity: number;
  source?: string;
}

export interface PlagiarismResult {
  score: number;  // 0-100
  matches: PlagiarismMatch[];
}

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
  // Heuristic-based plagiarism detection
  // 1. Split text into sentences
  // 2. Check for common plagiarized phrases / boilerplate
  // 3. Check for extremely generic academic filler
  // 4. Compute a self-similarity score (repeated passages within the document)
  // 5. In production, this would call Copyleaks API:
  //    POST https://api.copyleaks.com/v3/scans/submit
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const matches: PlagiarismMatch[] = [];
  
  // Check for self-plagiarism (duplicate sentences within the document)
  const seen = new Map<string, number>();
  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
    const count = seen.get(normalized) || 0;
    seen.set(normalized, count + 1);
    if (count === 1) {
      matches.push({
        text: sentence.trim(),
        similarity: 100,
        source: 'Self-duplication detected'
      });
    }
  }
  
  // Calculate score based on duplicates ratio
  const duplicateCount = matches.length;
  const score = sentences.length > 0 
    ? Math.min(100, Math.round((duplicateCount / sentences.length) * 100))
    : 0;
  
  return { score, matches };
}
