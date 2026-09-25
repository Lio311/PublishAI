export interface IncomingEmailData {
  sender: string;
  recipient?: string;
  subject: string;
  body: string;
  attachments?: any[]; // TODO: Define specific attachment type
}

// Dummy database service for scaffolding (can be mocked in tests)
export const db = {
  findSubmissionId: async (journalName: string, articleTitle: string): Promise<string | null> => {
    return null;
  }
};

// Dummy PDF parser service for scaffolding
export const pdfParser = {
  extractComments: async (attachment: any): Promise<string[]> => {
    return [];
  }
};

/**
 * Process incoming emails for the Ping-Pong (Revision) phase.
 * Extracts details to find the associated submission and parses attachments.
 */
export async function processIncomingReviewEmail(emailData: IncomingEmailData) {
  console.log('Processing incoming review email:', {
    sender: emailData.sender,
    recipient: emailData.recipient,
    subject: emailData.subject,
    attachmentsCount: emailData.attachments?.length || 0,
  });

  // Extract Journal Name from sender (e.g., editor@nature.com -> nature)
  const domain = emailData.sender.split('@')[1] || '';
  const journalName = domain.split('.')[0] || '';
  
  // Extract Article Title from subject (strip Re:, Fwd:, etc.)
  const articleTitle = emailData.subject.replace(/^(re|fwd|fw):\s*/i, '').trim();

  // Cross-reference Journal Name and Article Title in the database to find the correct `submission_id`.
  const submissionId = await db.findSubmissionId(journalName, articleTitle);

  const comments: string[] = [];

  // Handle attachments (e.g., save to storage, parse PDF contents to extract reviewer comments)
  if (emailData.attachments && emailData.attachments.length > 0) {
    for (const attachment of emailData.attachments) {
      if (attachment.contentType === 'application/pdf' || attachment.filename?.endsWith('.pdf')) {
        const extracted = await pdfParser.extractComments(attachment);
        comments.push(...extracted);
      }
    }
  }

  return {
    success: true,
    message: 'Email processing executed.',
    submissionId,
    comments,
  };
}
