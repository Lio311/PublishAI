/**
 * Integrity Scanner
 * A heuristic-based service for detecting plagiarism and AI-generated content.
 * In a real production system, this would call APIs like Turnitin or Copyleaks.
 */

export interface IntegrityReport {
  plagiarismScore: number; // 0-100 (higher means more copied)
  aiGeneratedScore: number; // 0-100 (higher means more likely AI)
  flaggedSentences: string[];
  passed: boolean;
  notes: string;
}

export class IntegrityScanner {
  /**
   * Scan text for plagiarism and AI footprint using basic heuristics.
   */
  static async scanManuscript(text: string): Promise<IntegrityReport> {
    console.log("[Integrity Scanner] Analyzing manuscript for plagiarism and AI patterns...");
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // 1. Plagiarism Heuristic
    let plagiarismScore = 0;
    const flaggedSentences: string[] = [];
    
    // Check for repeated 3-word phrases
    const phrases = new Map<string, number>();
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
    
    let repeatedPhrasesCount = 0;
    for (const count of phrases.values()) {
      if (count > 2) repeatedPhrasesCount++; // more than 2 times
    }
    
    plagiarismScore += Math.min(repeatedPhrasesCount * 5, 50); // up to 50%
    
    // Check uniqueness (unique words / total words)
    const uniqueWords = new Set(words).size;
    if (words.length > 0) {
      const uniquenessRatio = uniqueWords / words.length;
      if (uniquenessRatio < 0.3) {
        plagiarismScore += 30; // Very repetitive vocabulary
      } else if (uniquenessRatio < 0.4) {
        plagiarismScore += 15;
      }
    }

    if (text.toLowerCase().includes("lorem ipsum")) {
      plagiarismScore += 40;
      flaggedSentences.push("Contains placeholder text (Lorem ipsum).");
    }

    // 2. AI Detection Heuristic
    let aiGeneratedScore = 0;
    const aiKeywords = ["furthermore", "moreover", "it is worth noting", "in conclusion", "delve", "testament", "tapestry", "multifaceted"];
    
    let aiKeywordCount = 0;
    const lowerText = text.toLowerCase();
    for (const keyword of aiKeywords) {
      const regex = new RegExp(`\b${keyword}\b`, "g");
      const matches = lowerText.match(regex);
      if (matches) {
        aiKeywordCount += matches.length;
      }
    }
    
    aiGeneratedScore += Math.min(aiKeywordCount * 10, 60); // up to 60%
    
    // Check for uniform sentence length (AI tends to have less variance)
    if (sentences.length > 3) {
      const lengths = sentences.map(s => s.trim().split(' ').length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((a, b) => a + Math.pow(b - avgLength, 2), 0) / lengths.length;
      
      if (variance < 10) {
        // Very uniform sentence lengths
        aiGeneratedScore += 20;
      }
    }

    // Thresholds: Plagiarism > 20% or AI > 40% is considered a failure
    const passed = plagiarismScore < 20 && aiGeneratedScore < 40;

    return {
      plagiarismScore: Math.min(plagiarismScore, 100),
      aiGeneratedScore: Math.min(aiGeneratedScore, 100),
      flaggedSentences,
      passed,
      notes: passed 
        ? "Manuscript passed integrity checks." 
        : "Warning: High similarity or AI footprint detected. Manual review recommended.",
    };
  }
}
