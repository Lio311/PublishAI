import {
  getTransporter,
  getSenderAddress,
  getSafeTestMessageUrl,
  SendEmailResult,
} from "./notification-service";
import {
  renderSubmissionSuccessTemplate,
  renderSubmissionFailedTemplate,
  SubmissionSuccessTemplateParams,
  SubmissionFailedTemplateParams,
} from "./templates";

export interface SubmissionSuccessOptions {
  journalName?: string;
  recipientName?: string;
  confirmationId?: string;
  paperId?: string;
  appName?: string;
  supportEmail?: string;
  fromEmail?: string;
  throwOnError?: boolean;
}

export interface SubmissionFailedOptions {
  journalName?: string;
  recipientName?: string;
  retryUrl?: string;
  settingsUrl?: string;
  paperId?: string;
  appName?: string;
  supportEmail?: string;
  fromEmail?: string;
  throwOnError?: boolean;
}

/**
 * Sends a notification email informing the author that their manuscript
 * was successfully submitted to the target journal.
 */
export async function sendSubmissionSuccessEmail(
  userEmail: string,
  paperTitle: string,
  postUrl: string,
  options?: SubmissionSuccessOptions
): Promise<SendEmailResult> {
  try {
    const mailer = await getTransporter();
    const from = getSenderAddress(options?.fromEmail);

    const templateParams: SubmissionSuccessTemplateParams = {
      recipientEmail: userEmail,
      paperTitle,
      postUrl,
      journalName: options?.journalName,
      recipientName: options?.recipientName,
      confirmationId: options?.confirmationId,
      paperId: options?.paperId,
      appName: options?.appName,
      supportEmail: options?.supportEmail,
    };

    const { subject, html, text } = renderSubmissionSuccessTemplate(templateParams);

    const info = await mailer.sendMail({
      from,
      to: userEmail,
      subject,
      text,
      html,
    });

    const previewUrl = getSafeTestMessageUrl(mailer, info);

    console.log(
      `[Email Service] Success email sent to ${userEmail}. Message ID: ${info?.messageId || "N/A"}`
    );

    if (previewUrl) {
      console.log(`[Email Service] Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info?.messageId,
      previewUrl,
      ...info,
    };
  } catch (error: any) {
    console.error(`[Email Service] Error sending submission success email to ${userEmail}:`, error);

    if (options?.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

/**
 * Sends a notification email informing the author that manuscript submission failed,
 * with error diagnostics and actionable links to settings / retry.
 */
export async function sendSubmissionFailedEmail(
  userEmail: string,
  paperTitle: string,
  errorMsg: string,
  options?: SubmissionFailedOptions
): Promise<SendEmailResult> {
  try {
    const mailer = await getTransporter();
    const from = getSenderAddress(options?.fromEmail);

    const templateParams: SubmissionFailedTemplateParams = {
      recipientEmail: userEmail,
      paperTitle,
      errorMessage: errorMsg,
      journalName: options?.journalName,
      recipientName: options?.recipientName,
      retryUrl: options?.retryUrl,
      settingsUrl: options?.settingsUrl,
      paperId: options?.paperId,
      appName: options?.appName,
      supportEmail: options?.supportEmail,
    };

    const { subject, html, text } = renderSubmissionFailedTemplate(templateParams);

    const info = await mailer.sendMail({
      from,
      to: userEmail,
      subject,
      text,
      html,
    });

    const previewUrl = getSafeTestMessageUrl(mailer, info);

    console.log(
      `[Email Service] Failed email sent to ${userEmail}. Message ID: ${info?.messageId || "N/A"}`
    );

    if (previewUrl) {
      console.log(`[Email Service] Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info?.messageId,
      previewUrl,
      ...info,
    };
  } catch (error: any) {
    console.error(`[Email Service] Error sending submission failed email to ${userEmail}:`, error);

    if (options?.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}
