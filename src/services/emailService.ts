import { db } from '@/services/db';
import { journals, submissions, journalConnections } from '@/services/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

export interface IncomingEmailData {
  sender: string;
  recipient?: string;
  subject: string;
  body: string;
  attachments?: any[];
}

export async function processIncomingReviewEmail(emailData: IncomingEmailData) {
  console.log('Processing incoming review email:', {
    sender: emailData.sender,
    recipient: emailData.recipient,
    subject: emailData.subject,
    attachmentsCount: emailData.attachments?.length || 0,
  });

  const domain = emailData.sender.split('@')[1] || '';
  const journalName = domain.split('.')[0] || '';
  const articleTitle = emailData.subject.replace(/^(re|fwd|fw):\s*/i, '').trim();

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

  if (emailData.attachments && emailData.attachments.length > 0) {
    for (const attachment of emailData.attachments) {
      if (attachment.contentType === 'application/pdf' || attachment.filename?.endsWith('.pdf')) {
        try {
          const pdfParse = (await import('pdf-parse')).default;
          // Ensure we have a Buffer for pdf-parse
          const buffer = Buffer.isBuffer(attachment.content) 
            ? attachment.content 
            : Buffer.from(attachment.content, 'base64');
          const pdfData = await pdfParse(buffer);
          comments.push(`Extracted text from ${attachment.filename || 'PDF'}: ${pdfData.text}`);
        } catch (err: any) {
          console.error('Error parsing PDF:', err);
          comments.push(`Failed to extract text from ${attachment.filename || 'PDF'}: ${err.message}`);
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
