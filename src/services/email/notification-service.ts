import nodemailer from "nodemailer";
import {
  renderAwaitingApprovalTemplate,
  renderWeeklyDigestTemplate,
  renderGenericNotificationTemplate,
  htmlToPlainText,
  plainTextToHtml,
  AwaitingApprovalTemplateParams,
  WeeklyDigestTemplateParams,
  GenericNotificationTemplateParams,
} from "./templates";

/**
 * Cached transporter instance and pending initialization promise to prevent race conditions.
 */
let transporter: nodemailer.Transporter | null = null;
let transporterInitPromise: Promise<nodemailer.Transporter> | null = null;
let isCustomTransporter = false;

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  isTransient?: boolean;
  [key: string]: any;
}

export interface AttachmentOption {
  filename: string;
  content?: any;
  path?: string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: AttachmentOption[];
  throwOnError?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface AwaitingApprovalEmailOptions {
  recipientName?: string;
  customMessage?: string;
  stagesSummary?: string;
  dashboardUrl?: string;
  appName?: string;
  supportEmail?: string;
  fromEmail?: string;
  throwOnError?: boolean;
  maxRetries?: number;
}

export interface WeeklyDigestEmailOptions {
  papersCount?: number;
  submissionsCount?: number;
  highlights?: string[];
  dashboardUrl?: string;
  appName?: string;
  supportEmail?: string;
  fromEmail?: string;
  throwOnError?: boolean;
  maxRetries?: number;
}

export interface GenericNotificationEmailOptions {
  recipientName?: string;
  actionUrl?: string;
  actionText?: string;
  details?: Record<string, string>;
  appName?: string;
  supportEmail?: string;
  fromEmail?: string;
  throwOnError?: boolean;
  maxRetries?: number;
}

/**
 * Checks whether live email transport credentials are configured in the environment.
 */
export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_URL ||
    process.env.EMAIL_SERVER ||
    process.env.SMTP_HOST ||
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY ||
    process.env.POSTMARK_API_KEY ||
    process.env.POSTMARK_SERVER_TOKEN ||
    process.env.EMAIL_DRIVER === "json"
  );
}

/**
 * Resolves the sender email address from environment variables or defaults.
 * Prioritizes customFrom, SMTP_FROM, EMAIL_FROM, RESEND_FROM, SENDGRID_FROM, POSTMARK_FROM, then standard app default.
 */
export function getSenderAddress(customFrom?: string): string {
  if (customFrom) return customFrom;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.RESEND_FROM) return process.env.RESEND_FROM;
  if (process.env.SENDGRID_FROM) return process.env.SENDGRID_FROM;
  if (process.env.POSTMARK_FROM) return process.env.POSTMARK_FROM;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Publish AI";
  return `"${appName}" <noreply@publish-ai.com>`;
}

/**
 * Allows resetting the transporter instance (useful for testing, config updates, or error recovery).
 */
export function resetTransporter(): void {
  transporter = null;
  transporterInitPromise = null;
  isCustomTransporter = false;
}

/**
 * Allows setting a custom or mock transporter (useful for unit tests and isolated mocking).
 */
export function setTransporter(customTransporter: nodemailer.Transporter | null): void {
  transporter = customTransporter;
  transporterInitPromise = null;
  isCustomTransporter = customTransporter !== null;
}

/**
 * Safely extracts the preview URL from an Ethereal test account send result.
 */
export function getSafeTestMessageUrl(mailer: nodemailer.Transporter, info: any): string | undefined {
  try {
    const isEthereal =
      mailer.transporter?.name === "smtp.ethereal.email" ||
      (mailer.options as any)?.host === "smtp.ethereal.email";
    if (info && info.messageId && isEthereal) {
      const url = nodemailer.getTestMessageUrl(info);
      return url || undefined;
    }
  } catch {
    // Suppress preview URL extraction failures
  }
  return undefined;
}

/**
 * Detects whether an error thrown during email dispatch is transient (recoverable via retry).
 */
export function isTransientError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toUpperCase();
  const responseCode = Number(error.responseCode) || 0;
  const status = Number(error.status || error.statusCode) || 0;

  // Network and socket-level transient errors
  const transientCodes = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ESOCKETTIMEDOUT",
    "ETLSCONTIMEDOUT",
    "EDNS",
    "EPIPE",
  ];
  if (transientCodes.includes(code)) {
    return true;
  }

  // SMTP 4xx codes are transient failures
  if (responseCode >= 400 && responseCode < 500) {
    return true;
  }

  // HTTP rate limit (429) or service unavailable (503, 504)
  if (status === 429 || status === 503 || status === 504) {
    return true;
  }

  // String message indicators
  if (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("temporary failure") ||
    msg.includes("try again later") ||
    msg.includes("connection closed") ||
    msg.includes("greeting never received") ||
    msg.includes("socket closed") ||
    msg.includes("broken pipe") ||
    msg.includes("server busy") ||
    msg.includes("service unavailable") ||
    msg.includes("network error")
  ) {
    return true;
  }

  return false;
}

/**
 * Verifies the transporter connection against the configured mail server.
 */
export async function verifyTransport(
  mailer?: nodemailer.Transporter
): Promise<{ success: boolean; error?: string }> {
  try {
    const target = mailer || (await getTransporter());
    if (typeof target.verify === "function") {
      await target.verify();
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || String(err),
    };
  }
}

/**
 * Initializes and caches the appropriate Nodemailer transporter.
 * Supports SMTP (with automatic port 465 SSL vs 587 STARTTLS detection),
 * Resend (via Resend SMTP with RESEND_API_KEY), or local dev fallbacks.
 * Uses a promise lock to prevent race conditions during concurrent cold-starts.
 */
export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  if (transporterInitPromise) {
    return transporterInitPromise;
  }

  transporterInitPromise = (async () => {
    // 0. SMTP Connection String (EMAIL_SERVER / SMTP_URL)
    const smtpUrl = process.env.SMTP_URL || process.env.EMAIL_SERVER;
    if (smtpUrl) {
      try {
        const mailer = nodemailer.createTransport(smtpUrl, {
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
        });
        transporter = mailer;
        return transporter;
      } catch (err: any) {
        console.error("[Email Service] Failed to initialize SMTP URL transport:", err);
        throw err;
      }
    }

    // 1. Standard SMTP Transport
    if (process.env.SMTP_HOST) {
      try {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === "true" || port === 465;

        const mailer = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure,
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
        });

        transporter = mailer;
        return transporter;
      } catch (err: any) {
        console.error("[Email Service] Failed to initialize SMTP transport:", err);
        throw err;
      }
    }

    // 2. Resend Transport (via Resend SMTP with RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      try {
        const port = Number(process.env.RESEND_SMTP_PORT) || 465;
        const secure = port === 465;

        const mailer = nodemailer.createTransport({
          host: process.env.RESEND_SMTP_HOST || "smtp.resend.com",
          port,
          secure,
          auth: {
            user: "resend",
            pass: process.env.RESEND_API_KEY,
          },
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
        });

        console.log("[Email Service] Initialized Resend SMTP transport.");
        transporter = mailer;
        return transporter;
      } catch (err: any) {
        console.error("[Email Service] Failed to initialize Resend transport:", err);
        throw err;
      }
    }

    // 3. SendGrid Transport
    if (process.env.SENDGRID_API_KEY) {
      try {
        const mailer = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 465,
          secure: true,
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
        });

        console.log("[Email Service] Initialized SendGrid SMTP transport.");
        transporter = mailer;
        return transporter;
      } catch (err: any) {
        console.error("[Email Service] Failed to initialize SendGrid transport:", err);
        throw err;
      }
    }

    // 4. Postmark Transport
    const postmarkKey = process.env.POSTMARK_API_KEY || process.env.POSTMARK_SERVER_TOKEN;
    if (postmarkKey) {
      try {
        const mailer = nodemailer.createTransport({
          host: "smtp.postmarkapp.com",
          port: 587,
          secure: false,
          auth: {
            user: postmarkKey,
            pass: postmarkKey,
          },
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
        });

        console.log("[Email Service] Initialized Postmark SMTP transport.");
        transporter = mailer;
        return transporter;
      } catch (err: any) {
        console.error("[Email Service] Failed to initialize Postmark transport:", err);
        throw err;
      }
    }

    // 5. Production Warning / Error: Require live configuration in production
    if (process.env.NODE_ENV === "production" && process.env.EMAIL_DRIVER !== "json") {
      throw new Error(
        "[Email Service] Production email transport is not configured. Configure SMTP_HOST, SMTP_URL, RESEND_API_KEY, SENDGRID_API_KEY, or POSTMARK_API_KEY to enable live email delivery."
      );
    }

    // 6. Development & Test Environment fallback (Ethereal or JSON)
    if (process.env.EMAIL_DRIVER === "json") {
      transporter = nodemailer.createTransport({ jsonTransport: true });
      return transporter;
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        connectionTimeout: 10000,
        socketTimeout: 15000,
      });
      console.log(`[Email Service] Using Ethereal Email test account: ${testAccount.user}`);
      return transporter;
    } catch (err: any) {
      console.warn(
        `[Email Service] Failed to initialize Ethereal test account (${err?.message || err}). Falling back to JSON transport.`
      );
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return transporter;
    }
  })();

  try {
    const result = await transporterInitPromise;
    return result;
  } finally {
    transporterInitPromise = null;
  }
}

/**
 * Universal email dispatcher with automatic HTML/Text fallback generation,
 * transient error retry handling, and preview URL resolution.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  // Validate recipient
  const recipients = Array.isArray(options.to) ? options.to.filter(Boolean) : [options.to].filter(Boolean);
  if (recipients.length === 0) {
    const errorMsg = "Email recipient missing: 'to' field must contain at least one valid address";
    console.error(`[Email Service] ${errorMsg}`);
    if (options.throwOnError) {
      throw new Error(errorMsg);
    }
    return {
      success: false,
      error: errorMsg,
      isTransient: false,
    };
  }

  const from = getSenderAddress(options.from);
  let html = options.html;
  let text = options.text;

  // Validate and guarantee both HTML and Text fallbacks are always present
  if ((!html || !html.trim()) && (!text || !text.trim())) {
    const errorMsg = "Email content missing: at least one of 'html' or 'text' must be provided";
    console.error(`[Email Service] ${errorMsg}`);
    if (options.throwOnError) {
      throw new Error(errorMsg);
    }
    return {
      success: false,
      error: errorMsg,
      isTransient: false,
    };
  }

  if (html && (!text || !text.trim())) {
    text = htmlToPlainText(html);
  } else if (text && (!html || !html.trim())) {
    html = plainTextToHtml(text, options.subject);
  }

  const defaultRetries = process.env.NODE_ENV === "test" ? 0 : 2;
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : defaultRetries;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      const mailer = await getTransporter();

      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        text,
        html,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };

      const sendPromise = mailer.sendMail(mailOptions);
      const timeoutMs = options.timeoutMs || 30000;

      const info = await Promise.race([
        sendPromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                Object.assign(new Error(`Email dispatch timed out after ${timeoutMs}ms`), {
                  code: "ETIMEDOUT",
                })
              ),
            timeoutMs
          )
        ),
      ]);

      const previewUrl = getSafeTestMessageUrl(mailer, info);

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
      lastError = error;
      const transient = isTransientError(error);

      if (transient && attempt < maxRetries) {
        attempt++;
        const backoffMs = (process.env.NODE_ENV === "test" ? 10 : 500) * Math.pow(2, attempt - 1);
        console.warn(
          `[Email Service] Transient error dispatching email to ${options.to} (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${backoffMs}ms...`
        );

        // Reset transporter to re-establish dropped connection if not a custom mock
        if (!isCustomTransporter) {
          resetTransporter();
        }

        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        break;
      }
    }
  }

  console.error(`[Email Service] Error sending email to ${options.to}:`, lastError);

  if (options.throwOnError) {
    throw lastError;
  }

  return {
    success: false,
    error: lastError?.message || String(lastError),
    isTransient: isTransientError(lastError),
  };
}

/**
 * Sends an email notifying the author that their paper is awaiting user review and approval.
 */
export async function sendAwaitingApprovalEmail(
  userEmail: string,
  paperTitle: string,
  paperId: string,
  options?: AwaitingApprovalEmailOptions
): Promise<SendEmailResult> {
  try {
    const templateParams: AwaitingApprovalTemplateParams = {
      recipientEmail: userEmail,
      paperTitle,
      paperId,
      recipientName: options?.recipientName,
      dashboardUrl: options?.dashboardUrl,
      customMessage: options?.customMessage,
      stagesSummary: options?.stagesSummary,
      appName: options?.appName,
      supportEmail: options?.supportEmail,
    };

    const { subject, html, text } = renderAwaitingApprovalTemplate(templateParams);

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
        `[Email Service] Awaiting Approval email sent to ${userEmail}. Message ID: ${result.messageId || "N/A"}`
      );
    }

    return result;
  } catch (error: any) {
    console.error(`[Email Service] Error sending Awaiting Approval email to ${userEmail}:`, error);

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
 * Sends a weekly digest summary email to an active researcher.
 */
export async function sendWeeklyDigestEmail(
  userEmail: string,
  recipientName?: string,
  options?: WeeklyDigestEmailOptions
): Promise<SendEmailResult> {
  try {
    const templateParams: WeeklyDigestTemplateParams = {
      recipientEmail: userEmail,
      recipientName,
      papersCount: options?.papersCount,
      submissionsCount: options?.submissionsCount,
      highlights: options?.highlights,
      dashboardUrl: options?.dashboardUrl,
      appName: options?.appName,
      supportEmail: options?.supportEmail,
    };

    const { subject, html, text } = renderWeeklyDigestTemplate(templateParams);

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
        `[Email Service] Weekly digest email sent to ${userEmail}. Message ID: ${result.messageId || "N/A"}`
      );
    }

    return result;
  } catch (error: any) {
    console.error(`[Email Service] Error sending weekly digest email to ${userEmail}:`, error);

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
 * Sends a generic system notification email using the generic notification template.
 */
export async function sendGenericNotificationEmail(
  userEmail: string,
  title: string,
  message: string,
  options?: GenericNotificationEmailOptions
): Promise<SendEmailResult> {
  try {
    const templateParams: GenericNotificationTemplateParams = {
      recipientEmail: userEmail,
      title,
      message,
      recipientName: options?.recipientName,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
      details: options?.details,
      appName: options?.appName,
      supportEmail: options?.supportEmail,
    };

    const { subject, html, text } = renderGenericNotificationTemplate(templateParams);

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
        `[Email Service] Generic notification email sent to ${userEmail}. Message ID: ${result.messageId || "N/A"}`
      );
    }

    return result;
  } catch (error: any) {
    console.error(`[Email Service] Error sending generic notification email to ${userEmail}:`, error);

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

