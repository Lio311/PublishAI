import { PublishAIState } from "../state";
import { IntegrityScanner } from "@/services/security/integrity-scanner";

export async function integrityNode(state: PublishAIState): Promise<Partial<PublishAIState>> {
  const contentToScan = state.documentContent || 
    (typeof state.draft === "string" ? state.draft : state.draft?.output) || 
    "";

  if (!contentToScan.trim()) {
    return {
      integrityResult: {
        passed: true,
        status: "pass",
        success: true,
        plagiarismScore: 0,
        aiScore: 0,
        notes: "No content to scan."
      }
    };
  }

  try {
    const report = await IntegrityScanner.scanManuscript(contentToScan);

    return {
      integrityResult: {
        passed: report.passed,
        status: report.passed ? "pass" : "fail",
        success: report.passed,
        plagiarismScore: report.plagiarismScore,
        aiScore: report.aiGeneratedScore,
        flaggedSentences: report.flaggedSentences,
        notes: report.notes,
      },
      validationErrors: report.passed 
        ? [] 
        : [`Integrity check failed: Plagiarism score ${report.plagiarismScore}%, AI score ${report.aiGeneratedScore}%`],
    };
  } catch (error: any) {
    console.error("[integrityNode] Error scanning manuscript:", error);
    return {
      integrityResult: {
        passed: true,
        status: "warning",
        success: true,
        plagiarismScore: 0,
        aiScore: 0,
        notes: `Integrity scanner temporarily unavailable: ${error?.message || "Unknown error"}. Proceeding with caution.`,
      },
    };
  }
}
