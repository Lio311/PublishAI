import { sendEmail, getSenderAddress, plainTextToHtml, verifyTransport } from '@/services/email';
import { ConnectionTestResult, SubmissionPayload, SubmissionResult } from '../connection-types';

/**
 * Email-based submission adapter.
 * For journals that accept manuscript submissions via email.
 * Sends the manuscript package directly to the editor's email address via SMTP or Resend.
 */
export class EmailAdapter {
  private editorEmail: string;
  private authorName: string;
  private authorEmail: string;

  constructor(editorEmail: string, authorName: string, authorEmail: string) {
    this.editorEmail = editorEmail;
    this.authorName = authorName;
    this.authorEmail = authorEmail;
  }

  /**
   * Validates the editor and author email address format and verifies transport readiness.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editorEmail)) {
      return { success: false, message: 'Invalid editor email address format' };
    }
    if (this.authorEmail && !emailRegex.test(this.authorEmail)) {
      return { success: false, message: 'Invalid author email address format' };
    }
    try {
      const check = await verifyTransport();
      if (!check.success) {
        return { success: false, message: `Email transport verification failed: ${check.error}` };
      }
    } catch (err: any) {
      return { success: false, message: `Email transport connection error: ${err?.message || String(err)}` };
    }
    return { success: true, message: 'Email submission configured successfully' };
  }

  /**
   * Sends the manuscript package to the editor via email.
   * Uses centralized transport configuration (SMTP / Resend) with HTML & Plain-text fallbacks.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      const confirmationId = `EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const authorList = payload.authors
        .map(a => `${a.name} (${a.affiliation})`)
        .join(', ');

      const textBody = [
        `Dear Editor,`,
        ``,
        `Please find attached our manuscript titled "${payload.title}" for your consideration for publication.`,
        ``,
        `Abstract:`,
        payload.abstract,
        ``,
        `Keywords: ${payload.keywords.join(', ')}`,
        `Authors: ${authorList}`,
        `Article Type: ${payload.articleType}`,
        ``,
        payload.coverLetter ? `--- Cover Letter ---\n${payload.coverLetter}\n` : '',
        `Sincerely,`,
        this.authorName,
        ``,
        `---`,
        `Submitted via PublishAI | Confirmation ID: ${confirmationId}`,
      ].filter(Boolean).join('\n');

      const htmlBody = plainTextToHtml(textBody, `Manuscript Submission: ${payload.title}`);

      // When sending to an external journal editor, the authenticated SMTP sender must be used
      // as the 'from' address to avoid SPF/DKIM/DMARC failures, while setting 'replyTo' to the author.
      const senderAddress = getSenderAddress();
      const authorReplyTo = this.authorEmail ? `"${this.authorName}" <${this.authorEmail}>` : undefined;

      const result = await sendEmail({
        from: senderAddress,
        replyTo: authorReplyTo,
        to: this.editorEmail,
        subject: `Manuscript Submission: ${payload.title}`,
        text: textBody,
        html: htmlBody,
        attachments: payload.attachments.map(att => ({
          filename: att.filename,
          content: att.buffer,
          contentType: att.mimeType,
        })),
      });

      if (!result.success) {
        return {
          success: false,
          error: `Email submission failed: ${result.error}`,
        };
      }

      return {
        success: true,
        confirmationId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Email submission failed: ${error?.message || String(error)}`,
      };
    }
  }
}

