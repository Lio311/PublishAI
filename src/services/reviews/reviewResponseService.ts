import { parseReviewerReport } from '../documents';
import { ParsedReviewerReport, ReviewerCommentItem } from '../documents/types';

export interface DraftResponseOptions {
  authorResponses: Record<string, string>; // comment id to author response text
  paperTitle?: string;
  authors?: string[];
}

export class ReviewResponseService {
  /**
   * Parse an uploaded reviewer report using the Document Processing parser.
   * Replaces previous placeholder logic with real parser.
   */
  async processReviewReport(
    buffer: Buffer | string,
    filenameOrMime?: string
  ): Promise<ParsedReviewerReport> {
    return parseReviewerReport(buffer, filenameOrMime);
  }

  /**
   * Generate a response letter template from a parsed report.
   * This provides a structured document for authors to fill in their responses.
   */
  generateResponseTemplate(report: ParsedReviewerReport, paperTitle?: string): string {
    let template = `# Response to Reviewers\n\n`;
    
    if (paperTitle) {
      template += `**Paper Title:** ${paperTitle}\n\n`;
    }
    
    template += `Dear Editor,\n\n`;
    template += `Thank you for the opportunity to revise our manuscript. We appreciate the careful review and the constructive feedback from the reviewers.\n\n`;
    
    if (report.editorComments) {
      template += `## Editor Comments\n`;
      template += `> ${report.editorComments}\n\n`;
      template += `**Response:** [Insert response to editor here]\n\n`;
    }

    if (report.reviewers.length > 0) {
      for (const reviewer of report.reviewers) {
        template += `## ${reviewer.reviewerId}\n\n`;
        for (const comment of reviewer.comments) {
          template += `### Comment ${comment.commentNumber} (${comment.category || 'general'} - ${comment.severity || 'minor'})\n`;
          template += `> ${comment.rawText}\n\n`;
          template += `**Response:** [Insert response to Comment ${comment.commentNumber} here]\n\n`;
        }
      }
    } else {
      template += `No structured reviewer comments found.\n\n`;
    }

    template += `Sincerely,\nThe Authors\n`;
    return template;
  }

  /**
   * Draft the final response document by merging the parsed report with the authors' responses.
   */
  draftFinalResponse(report: ParsedReviewerReport, options: DraftResponseOptions): string {
    let draft = `# Final Response to Reviewers\n\n`;
    
    if (options.paperTitle) {
      draft += `**Paper Title:** ${options.paperTitle}\n\n`;
    }

    if (options.authors?.length) {
      draft += `**Authors:** ${options.authors.join(', ')}\n\n`;
    }
    
    draft += `Dear Editor,\n\n`;
    draft += `Thank you for handling our manuscript. Below, we provide a point-by-point response to the reviewers' comments.\n\n`;

    if (report.editorComments) {
      draft += `## Editor Comments\n`;
      draft += `> ${report.editorComments}\n\n`;
      const authorResponse = options.authorResponses['editor'] || 'Thank you for your guidance. We have addressed the concerns as detailed below.';
      draft += `**Author Response:**\n${authorResponse}\n\n`;
    }

    for (const reviewer of report.reviewers) {
      draft += `## ${reviewer.reviewerId}\n\n`;
      
      for (const comment of reviewer.comments) {
        draft += `### Comment ${comment.commentNumber}\n`;
        draft += `> ${comment.rawText}\n\n`;
        
        const responseText = options.authorResponses[comment.id] || '[No response provided]';
        draft += `**Author Response:**\n${responseText}\n\n`;
      }
    }

    draft += `Sincerely,\n`;
    if (options.authors?.length) {
      draft += `${options.authors[0]} (on behalf of all authors)\n`;
    } else {
      draft += `The Authors\n`;
    }

    return draft;
  }
}

export const reviewResponseService = new ReviewResponseService();
