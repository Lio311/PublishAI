/**
 * Review Response Service
 * 
 * Coordinates the automated generation of point-by-point rebuttals and author responses
 * to peer review reports and editorial decisions.
 * 
 * NOTE: Currently pending integration with Document Processing parser (for extracting 
 * structured reviewer comments from uploaded PDFs / Word documents).
 */

export interface ReviewComment {
  id: string;
  reviewerId: string; // e.g. "Reviewer 1", "Reviewer 2", "Editor"
  commentNumber: number;
  category: "methodology" | "results" | "literature" | "clarity" | "editorial" | "major" | "minor";
  rawText: string;
  contextSnippet?: string;
  manuscriptSection?: string;
  lineReference?: string;
}

export type RebuttalStance = "agree" | "partially_agree" | "respectfully_disagree" | "clarification_only";

export interface ResponseDraft {
  commentId: string;
  stance: RebuttalStance;
  rebuttalText: string;
  proposedManuscriptChanges?: string;
  revisedExcerpt?: string;
  citationsToAdd?: string[];
  isApprovedByAuthor: boolean;
}

export interface ReviewResponseSession {
  id: string;
  paperId: string;
  status: "pending_document_parse" | "parsed" | "generating_drafts" | "drafted" | "completed";
  reviewerComments: ReviewComment[];
  responses: Record<string, ResponseDraft>;
  coverLetterHeader?: string;
  generalRemarks?: string;
  closingRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateResponseOptions {
  tone?: "academic_polite" | "firm_concise" | "thorough_detailed";
  customInstructions?: string;
  includeManuscriptChanges?: boolean;
}

/**
 * Placeholder: Parses uploaded review reports into individual structured comments.
 * BLOCKED ON: Document Processing parser agent.
 */
export async function parseReviewComments(
  documentBufferOrText: string | Buffer,
  _filename?: string
): Promise<ReviewComment[]> {
  // TODO: Connect with Document Processing parser once available
  if (!documentBufferOrText) {
    throw new Error("Review document content is required for parsing.");
  }

  // Placeholder parser logic
  return [
    {
      id: "comment-1",
      reviewerId: "Reviewer 1",
      commentNumber: 1,
      category: "methodology",
      rawText: "The authors should clarify the sample size selection and control group criteria in Section 2.3.",
      manuscriptSection: "Methods",
      lineReference: "Lines 142-155",
    },
    {
      id: "comment-2",
      reviewerId: "Reviewer 1",
      commentNumber: 2,
      category: "literature",
      rawText: "Relevant recent literature from 2024-2025 regarding similar benchmarks is missing from the discussion.",
      manuscriptSection: "Discussion",
    },
    {
      id: "comment-3",
      reviewerId: "Reviewer 2",
      commentNumber: 1,
      category: "clarity",
      rawText: "Figure 3 is difficult to read. Please improve axis labeling and color contrast.",
      manuscriptSection: "Results",
    },
  ];
}

/**
 * Generates an academic point-by-point response draft for a given reviewer comment.
 * Uses manuscript context and specified stance.
 */
export async function generateCommentResponse(
  comment: ReviewComment,
  _manuscriptContext: string,
  stance: RebuttalStance = "agree",
  options?: GenerateResponseOptions
): Promise<ResponseDraft> {
  const _tone = options?.tone ?? "academic_polite";

  // Placeholder response template generator
  let responsePreamble = "";
  switch (stance) {
    case "agree":
      responsePreamble = "We thank the reviewer for this insightful comment. We completely agree and have revised the manuscript accordingly.";
      break;
    case "partially_agree":
      responsePreamble = "We appreciate the reviewer's perspective. While we have incorporated these considerations, we also clarify our primary rationale.";
      break;
    case "respectfully_disagree":
      responsePreamble = "We thank the reviewer for raising this point. Respectfully, we wish to clarify that the current approach was chosen because...";
      break;
    case "clarification_only":
      responsePreamble = "We thank the reviewer for this helpful observation and have added clarifying text to ensure this is evident to readers.";
      break;
  }

  // Placeholder response draft
  return {
    commentId: comment.id,
    stance,
    rebuttalText: `${responsePreamble} Specifically, regarding: "${comment.rawText.slice(0, 80)}...", we have updated Section ${comment.manuscriptSection ?? "relevant sections"} to provide comprehensive clarification.`,
    proposedManuscriptChanges: `Updated ${comment.manuscriptSection ?? "the manuscript"} to address reviewer concern in detail.`,
    revisedExcerpt: `[Revised text addressing ${comment.category} concern]`,
    isApprovedByAuthor: false,
  };
}

/**
 * Compiles all approved responses into a complete formatted rebuttal document (letter).
 */
export async function generateFullRebuttalDocument(
  session: ReviewResponseSession
): Promise<string> {
  const header = session.coverLetterHeader ?? "Dear Editor and Reviewers,\n\nThank you for the opportunity to revise our manuscript. We have addressed all comments below point-by-point.\n";
  const generalRemarks = session.generalRemarks ? `\nGeneral Remarks:\n${session.generalRemarks}\n` : "";

  let pointByPointBody = "\n--- Point-by-Point Responses ---\n\n";

  for (const comment of session.reviewerComments) {
    const response = session.responses[comment.id];
    pointByPointBody += `[${comment.reviewerId} - Comment #${comment.commentNumber}]\n`;
    pointByPointBody += `Comment: ${comment.rawText}\n\n`;
    if (response) {
      pointByPointBody += `Response (${response.stance}):\n${response.rebuttalText}\n`;
      if (response.revisedExcerpt) {
        pointByPointBody += `Changes in manuscript:\n"${response.revisedExcerpt}"\n`;
      }
    } else {
      pointByPointBody += `Response: [Pending author review / draft]\n`;
    }
    pointByPointBody += `\n----------------------------------------\n\n`;
  }

  const closing = session.closingRemarks ?? "We believe these revisions address all concerns raised and improve the quality of our manuscript.\n\nSincerely,\nThe Authors";

  return `${header}${generalRemarks}${pointByPointBody}${closing}`;
}
