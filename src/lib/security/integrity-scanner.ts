/**
 * Integrity Scanner
 * A mock service for detecting plagiarism and AI-generated content.
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
   * Scan text for plagiarism and AI footprint.
   */
  static async scanManuscript(text: string): Promise<IntegrityReport> {
    console.log("[Integrity Scanner] Analyzing manuscript for plagiarism and AI patterns...");
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock logic: randomly generate scores, but generally keep them "safe" for the MVP
    // If the text contains the word "Lorem", flag it higher.
    const isLorem = text.toLowerCase().includes("lorem");
    
    const plagiarismScore = isLorem ? 45 : Math.floor(Math.random() * 15); // 0-15% is usually acceptable
    const aiGeneratedScore = Math.floor(Math.random() * 20); // 0-20% is acceptable

    // Thresholds: Plagiarism > 20% or AI > 40% is considered a failure
    const passed = plagiarismScore < 20 && aiGeneratedScore < 40;

    const flaggedSentences = isLorem 
      ? ["Lorem ipsum dolor sit amet..."] 
      : [];

    return {
      plagiarismScore,
      aiGeneratedScore,
      flaggedSentences,
      passed,
      notes: passed 
        ? "Manuscript passed integrity checks." 
        : "Warning: High similarity or AI footprint detected. Manual review recommended.",
    };
  }
}
