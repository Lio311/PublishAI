import {
  sendEmail,
  SendEmailResult,
  isTransientError,
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
  maxRetries?: number;
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
  maxRetries?: number;
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

    const result = await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
      from: options?.fromEmail,
      throwOnError: options?.throwOnError,
      maxRetries: options?.maxRetries,
    });

    if (result.success) {
      console.log(
        `[Email Service] Success email sent to ${userEmail}. Message ID: ${result.messageId || "N/A"}`
      );
    }

    return result;
  } catch (error: any) {
    console.error(`[Email Service] Error sending submission success email to ${userEmail}:`, error);

    if (options?.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error?.message || String(error),
      isTransient: isTransientError(error),
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

    const result = await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
      from: options?.fromEmail,
      throwOnError: options?.throwOnError,
      maxRetries: options?.maxRetries,
    });

    if (result.success) {
      console.log(
        `[Email Service] Failed email sent to ${userEmail}. Message ID: ${result.messageId || "N/A"}`
      );
    }

    return result;
  } catch (error: any) {
    console.error(`[Email Service] Error sending submission failed email to ${userEmail}:`, error);

    if (options?.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error?.message || String(error),
      isTransient: isTransientError(error),
    };
  }
}
