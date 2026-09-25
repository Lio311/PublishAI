export async function integrityNode(state: any) {
  const { draft } = state;

  if (!draft) {
    return {
      integrityResult: {
        passed: true,
        plagiarismScore: 0,
        aiScore: 0
      }
    };
  }

  // Here you would integrate with an actual scanning service API (e.g., Originality.ai, Copyleaks).
  // We'll simulate the scanner analyzing the draft.
  
  // Simulated scores (in a real app, await scan(draft))
  const plagiarismScore = generateSimulatedScore(draft, 'plagiarism');
  const aiScore = generateSimulatedScore(draft, 'ai');

  // Define thresholds
  const PLAGIARISM_THRESHOLD = 0.20; // 20%
  const AI_THRESHOLD = 0.40; // 40%

  // If score > threshold, passed is false
  const passed = plagiarismScore <= PLAGIARISM_THRESHOLD && aiScore <= AI_THRESHOLD;

  return {
    integrityResult: {
      passed,
      plagiarismScore,
      aiScore
    }
  };
}

// Helper to simulate a score based on text length/content for demonstration
function generateSimulatedScore(text: string, type: 'plagiarism' | 'ai'): number {
  // Return a deterministic mock score between 0 and 1
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const base = (hash % 100) / 100;
  
  if (type === 'plagiarism') {
    return base * 0.3; // keeping mock plagiarism generally low
  } else {
    return base * 0.6; // keeping mock AI score somewhat varied
  }
}
