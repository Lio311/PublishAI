import pdfParse from 'pdf-parse';
import { db } from '@/services/db';
import { journals, submissions, journalConnections } from '@/services/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

export interface IncomingEmailData {
  sender: string;
  recipient?: string;
  subject: string;
  body: string;
  attachments?: any[]; // TODO: Define specific attachment type
}

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
  let submissionId: string | null = null;
  
  try {
    const result = await db.select({ id: submissions.id })
      .from(submissions)
      .innerJoin(journalConnections, eq(submissions.connectionId, journalConnections.id))
      .innerJoin(journals, eq(journalConnections.journalId, journals.id))
      .where(
        and(
          ilike(journals.name, `%${journalName}%`),
          ilike(submissions.submittedTitle, `%${articleTitle}%`)
        )
      )
      .limit(1);

    if (result.length > 0) {
      submissionId = result[0].id.toString();
    }
  } catch (err) {
    console.error('Error finding submissionId:', err);
  }

  const comments: string[] = [];

  // Handle attachments (e.g., save to storage, parse PDF contents to extract reviewer comments)
  if (emailData.attachments && emailData.attachments.length > 0) {
    for (const attachment of emailData.attachments) {
      if (attachment.contentType === 'application/pdf' || attachment.filename?.endsWith('.pdf')) {
        try {
          if (attachment.content) {
            const buffer = Buffer.isBuffer(attachment.content) 
              ? attachment.content 
              : Buffer.from(attachment.content, 'base64');
            const pdfData = await pdfParse(buffer);
            comments.push(pdfData.text);
          }
        } catch (err) {
          console.error(`Error parsing PDF attachment ${attachment.filename}:`, err);
        }
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
