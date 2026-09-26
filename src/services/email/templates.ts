/**
 * Dynamic email templates for PublishAI notifications and submission lifecycle.
 */

export interface EmailTemplateOutput {
  subject: string;
  html: string;
  text: string;
}

export interface BaseLayoutOptions {
  title: string;
  previewText?: string;
  appName?: string;
  supportEmail?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface AwaitingApprovalTemplateParams {
  recipientEmail: string;
  paperTitle: string;
  paperId: string;
  recipientName?: string;
  dashboardUrl?: string;
  customMessage?: string;
  stagesSummary?: string;
  appName?: string;
  supportEmail?: string;
}

export interface SubmissionSuccessTemplateParams {
  recipientEmail: string;
  paperTitle: string;
  postUrl: string;
  journalName?: string;
  recipientName?: string;
  confirmationId?: string;
  paperId?: string;
  appName?: string;
  supportEmail?: string;
}

export interface SubmissionFailedTemplateParams {
  recipientEmail: string;
  paperTitle: string;
  errorMessage: string;
  journalName?: string;
  recipientName?: string;
  retryUrl?: string;
  settingsUrl?: string;
  paperId?: string;
  appName?: string;
  supportEmail?: string;
}

export interface WeeklyDigestTemplateParams {
  recipientEmail: string;
  recipientName?: string;
  papersCount?: number;
  submissionsCount?: number;
  highlights?: string[];
  dashboardUrl?: string;
  appName?: string;
  supportEmail?: string;
}

/**
 * Escapes characters that have special meaning in HTML to prevent injection.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Wraps dynamic content in a responsive, branded HTML email container.
 */
export function renderBaseLayout(contentHtml: string, options: BaseLayoutOptions): string {
  const appName = options.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Publish AI';
  const supportEmail = options.supportEmail || process.env.SUPPORT_EMAIL || 'support@publish-ai.com';
  const currentYear = new Date().getFullYear();

  const actionButtonHtml = options.actionUrl && options.actionText
    ? `
      <div style="margin: 32px 0 24px 0; text-align: center;">
        <a href="${escapeHtml(options.actionUrl)}" style="background-color: #4f46e5; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
          ${escapeHtml(options.actionText)}
        </a>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  ${options.previewText ? `<span style="display:none;font-size:0px;color:transparent;opacity:0;height:0;width:0;line-height:0;">${escapeHtml(options.previewText)}</span>` : ''}
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #1e1b4b; padding: 24px 32px; border-bottom: 2px solid #4f46e5;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
        ${escapeHtml(appName)}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      ${contentHtml}
      ${actionButtonHtml}
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center;">
      <p style="margin: 0 0 8px 0;">Sent by <strong>${escapeHtml(appName)}</strong> &bull; Autonomous Academic Publishing Platform</p>
      <p style="margin: 0 0 8px 0;">Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color: #4f46e5; text-decoration: none;">${escapeHtml(supportEmail)}</a></p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${currentYear} ${escapeHtml(appName)}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds email content when a manuscript is ready for user review and approval.
 */
export function renderAwaitingApprovalTemplate(params: AwaitingApprovalTemplateParams): EmailTemplateOutput {
  const appName = params.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Publish AI';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const dashboardUrl = params.dashboardUrl || `${baseUrl}/papers/${params.paperId}`;
  const recipientGreeting = params.recipientName ? `Hello ${escapeHtml(params.recipientName)},` : 'Hello,';
  const subject = `Your manuscript is ready for review: ${params.paperTitle}`;

  const summary = params.stagesSummary || 'Our autonomous agents have optimized the formatting, enhanced academic tone, verified citations, and generated a simulated peer review report.';

  const customMessageHtml = params.customMessage
    ? `<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #166534;">
        ${escapeHtml(params.customMessage)}
       </div>`
    : '';

  const bodyHtml = `
    <h2 style="color: #1e1b4b; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">
      Manuscript Ready for Review
    </h2>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">${recipientGreeting}</p>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
      The AI revision process for your manuscript <strong>&ldquo;${escapeHtml(params.paperTitle)}&rdquo;</strong> has been successfully completed.
    </p>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #475569;">
      ${escapeHtml(summary)}
    </p>
    ${customMessageHtml}
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px; color: #475569;">
      Please inspect the full diff, review the simulated reviewers&apos; feedback, and confirm approval before journal submission.
    </p>
  `;

  const html = renderBaseLayout(bodyHtml, {
    title: subject,
    previewText: `Your manuscript "${params.paperTitle}" is ready for approval.`,
    appName,
    supportEmail: params.supportEmail,
    actionUrl: dashboardUrl,
    actionText: 'Review and Approve Changes',
  });

  const text = [
    `Manuscript Ready for Review`,
    ``,
    recipientGreeting,
    ``,
    `The AI revision process for your manuscript "${params.paperTitle}" has been successfully completed.`,
    summary,
    params.customMessage ? `\nNote: ${params.customMessage}\n` : '',
    `Review and approve your manuscript changes here:`,
    dashboardUrl,
    ``,
    `Best regards,`,
    `The ${appName} Team`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/**
 * Builds email content when a manuscript submission succeeds.
 */
export function renderSubmissionSuccessTemplate(params: SubmissionSuccessTemplateParams): EmailTemplateOutput {
  const appName = params.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Publish AI';
  const recipientGreeting = params.recipientName ? `Hello ${escapeHtml(params.recipientName)},` : 'Hello,';
  const targetJournal = params.journalName ? ` to ${params.journalName}` : '';
  const subject = `Your paper "${params.paperTitle}" was successfully submitted${targetJournal}`;

  const confirmationSnippetHtml = params.confirmationId
    ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 14px;">
        <span style="color: #64748b;">Confirmation Reference:</span>
        <code style="color: #0f172a; font-weight: 600; margin-left: 6px; font-family: monospace;">${escapeHtml(params.confirmationId)}</code>
       </div>`
    : '';

  const bodyHtml = `
    <div style="display: flex; align-items: center; margin-bottom: 16px;">
      <h2 style="color: #15803d; font-size: 22px; margin: 0; font-weight: 700;">
        &check; Submission Successful
      </h2>
    </div>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">${recipientGreeting}</p>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
      We&apos;re happy to let you know that your paper <strong>&ldquo;${escapeHtml(params.paperTitle)}&rdquo;</strong> was successfully submitted${params.journalName ? ` to <strong>${escapeHtml(params.journalName)}</strong>` : ' to the journal'}.
    </p>
    ${confirmationSnippetHtml}
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px; color: #475569;">
      You can track the ongoing status of your paper and manage submission receipts via the portal:
    </p>
    <p style="font-size: 14px; word-break: break-all; margin-top: 16px; color: #64748b;">
      Submission URL: <a href="${escapeHtml(params.postUrl)}" style="color: #4f46e5;">${escapeHtml(params.postUrl)}</a>
    </p>
    <p style="font-size: 15px; line-height: 1.6; margin-top: 24px; color: #475569;">
      Best regards,<br>
      <strong>The ${escapeHtml(appName)} Team</strong>
    </p>
  `;

  const html = renderBaseLayout(bodyHtml, {
    title: subject,
    previewText: `Your paper "${params.paperTitle}" was submitted successfully.`,
    appName,
    supportEmail: params.supportEmail,
    actionUrl: params.postUrl,
    actionText: 'View Submission on Journal Portal',
  });

  const text = [
    `Submission Successful`,
    ``,
    recipientGreeting,
    ``,
    `We're happy to let you know that your paper "${params.paperTitle}" was successfully submitted${params.journalName ? ` to ${params.journalName}` : ' to the journal'}.`,
    params.confirmationId ? `Confirmation Reference: ${params.confirmationId}` : '',
    ``,
    `View your submission here:`,
    params.postUrl,
    ``,
    `Best regards,`,
    `The ${appName} Team`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/**
 * Builds email content when a manuscript submission fails.
 */
export function renderSubmissionFailedTemplate(params: SubmissionFailedTemplateParams): EmailTemplateOutput {
  const appName = params.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Publish AI';
  const recipientGreeting = params.recipientName ? `Hello ${escapeHtml(params.recipientName)},` : 'Hello,';
  const subject = `Action Required: Submission failed for "${params.paperTitle}"`;
  const actionUrl = params.retryUrl || params.settingsUrl;
  const actionText = params.retryUrl ? 'Retry Submission' : (params.settingsUrl ? 'Review Journal Settings' : undefined);

  const bodyHtml = `
    <h2 style="color: #b91c1c; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">
      Submission Encountered an Issue
    </h2>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">${recipientGreeting}</p>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
      We attempted to submit your paper <strong>&ldquo;${escapeHtml(params.paperTitle)}&rdquo;</strong>${params.journalName ? ` to <strong>${escapeHtml(params.journalName)}</strong>` : ''}, but encountered an error.
    </p>

    <!-- Error Box -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <div style="font-weight: 600; color: #991b1b; font-size: 14px; margin-bottom: 6px;">Error Details:</div>
      <code style="display: block; font-family: monospace; font-size: 13px; color: #b91c1c; word-break: break-all; white-space: pre-wrap;">${escapeHtml(params.errorMessage)}</code>
    </div>

    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px; color: #475569;">
      Please check your journal credentials, API keys, or connection settings in the system, and try again.
    </p>
    ${params.settingsUrl ? `<p style="font-size: 14px; margin-bottom: 12px;"><a href="${escapeHtml(params.settingsUrl)}" style="color: #4f46e5; font-weight: 600;">Update Journal Connection Settings &rarr;</a></p>` : ''}
    <p style="font-size: 15px; line-height: 1.6; margin-top: 24px; color: #475569;">
      Best regards,<br>
      <strong>The ${escapeHtml(appName)} Team</strong>
    </p>
  `;

  const html = renderBaseLayout(bodyHtml, {
    title: subject,
    previewText: `Action required: Submission failed for "${params.paperTitle}"`,
    appName,
    supportEmail: params.supportEmail,
    actionUrl,
    actionText,
  });

  const text = [
    `Submission Encountered an Issue`,
    ``,
    recipientGreeting,
    ``,
    `We attempted to submit your paper "${params.paperTitle}"${params.journalName ? ` to ${params.journalName}` : ''}, but encountered an error:`,
    ``,
    `Error details: ${params.errorMessage}`,
    ``,
    `Please check your journal credentials and connection settings in the system, and try again.`,
    actionUrl ? `Action Link: ${actionUrl}` : '',
    ``,
    `Best regards,`,
    `The ${appName} Team`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/**
 * Builds email content for weekly activity digests.
 */
export function renderWeeklyDigestTemplate(params: WeeklyDigestTemplateParams): EmailTemplateOutput {
  const appName = params.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Publish AI';
  const recipientGreeting = params.recipientName ? `Hello ${escapeHtml(params.recipientName)},` : 'Hello,';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const dashboardUrl = params.dashboardUrl || `${baseUrl}/dashboard`;
  const subject = `Your Weekly Digest from ${appName}`;

  const highlightsHtml = params.highlights && params.highlights.length > 0
    ? `
      <div style="margin: 20px 0;">
        <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 10px;">Highlights:</h3>
        <ul style="padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
          ${params.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  const bodyHtml = `
    <h2 style="color: #1e1b4b; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">
      Weekly Publishing Digest
    </h2>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">${recipientGreeting}</p>
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
      Here is your weekly summary of activity across your manuscripts and submissions in <strong>${escapeHtml(appName)}</strong>:
    </p>
    <div style="display: flex; gap: 12px; margin: 20px 0;">
      <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: #4f46e5;">${params.papersCount ?? 0}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Active Papers</div>
      </div>
      <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: #16a34a;">${params.submissionsCount ?? 0}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Submissions</div>
      </div>
    </div>
    ${highlightsHtml}
    <p style="font-size: 15px; line-height: 1.6; margin-top: 24px; color: #475569;">
      Best regards,<br>
      <strong>The ${escapeHtml(appName)} Team</strong>
    </p>
  `;

  const html = renderBaseLayout(bodyHtml, {
    title: subject,
    previewText: `Weekly summary of manuscripts and submissions in ${appName}.`,
    appName,
    supportEmail: params.supportEmail,
    actionUrl: dashboardUrl,
    actionText: 'Go to Dashboard',
  });

  const text = [
    `Weekly Publishing Digest`,
    ``,
    recipientGreeting,
    ``,
    `Active Papers: ${params.papersCount ?? 0}`,
    `Submissions: ${params.submissionsCount ?? 0}`,
    params.highlights && params.highlights.length ? `\nHighlights:\n${params.highlights.map(h => `- ${h}`).join('\n')}` : '',
    ``,
    `Access your dashboard here: ${dashboardUrl}`,
    ``,
    `Best regards,`,
    `The ${appName} Team`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}
