import nodemailer from 'nodemailer';
import { ConnectionTestResult, SubmissionPayload, SubmissionResult } from '../connection-types';

/**
 * Email-based submission adapter.
 * For journals that accept manuscript submissions via email.
 * Sends the manuscript package directly to the editor's email address via SMTP.
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
   * Validates the editor email address format.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editorEmail)) {
      return { success: false, message: 'Invalid editor email address format' };
    }
    if (!emailRegex.test(this.authorEmail)) {
      return { success: false, message: 'Invalid author email address format' };
    }
    return { success: true, message: 'Email submission configured successfully' };
  }

  /**
   * Sends the manuscript package to the editor via email.
   * Uses SMTP configuration from environment variables.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const confirmationId = `EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const authorList = payload.authors
        .map(a => `${a.name} (${a.affiliation})`)
        .join(', ');

      await transporter.sendMail({
        from: `"${this.authorName}" <${this.authorEmail}>`,
        to: this.editorEmail,
        subject: `Manuscript Submission: ${payload.title}`,
        text: [
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
        ].filter(Boolean).join('\n'),
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
