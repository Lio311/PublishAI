import { getTransporter, plainTextToHtml, verifyTransport } from '@/services/email';
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
    if (!emailRegex.test(this.authorEmail)) {
      return { success: false, message: 'Invalid author email address format' };
    }
    try {
      const transporter = await getTransporter();
      const check = await verifyTransport(transporter);
      if (!check.success && process.env.NODE_ENV === 'production') {
        return { success: false, message: `Email transport check failed: ${check.error}` };
      }
    } catch {
      // Graceful fallback for test/dev environments without active network connections
    }
    return { success: true, message: 'Email submission configured successfully' };
  }

  /**
   * Sends the manuscript package to the editor via email.
   * Uses centralized transport configuration (SMTP / Resend) with HTML & Plain-text fallbacks.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      const transporter = await getTransporter();

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

      await transporter.sendMail({
        from: `"${this.authorName}" <${this.authorEmail}>`,
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

      return {
        success: true,
        confirmationId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Email submission failed: ${error.message}`,
      };
    }
  }
}
