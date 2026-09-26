import nodemailer from "nodemailer";
import {
  renderAwaitingApprovalTemplate,
  AwaitingApprovalTemplateParams,
} from "./templates";

/**
 * For local development and testing, we use Ethereal Email or JSON transport.
 * In production or when SMTP_HOST is configured, we use the specified SMTP server.
 */
let transporter: nodemailer.Transporter | null = null;

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  [key: string]: any;
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
}

/**
 * Resolves the sender email address from environment variables or defaults.
 */
export function getSenderAddress(customFrom?: string): string {
  if (customFrom) return customFrom;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Publish AI";
  return `"${appName}" <noreply@publish-ai.com>`;
}

/**
 * Allows resetting the transporter instance (useful for testing or config updates).
 */
export function resetTransporter(): void {
  transporter = null;
}

/**
 * Allows setting a custom or mock transporter (useful for testing).
 */
export function setTransporter(customTransporter: nodemailer.Transporter | null): void {
  transporter = customTransporter;
}

/**
 * Safely extracts the preview URL from an ethereal test account send result.
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

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporter) {
    if (process.env.SMTP_HOST || (process.env.NODE_ENV === "production" && process.env.SMTP_HOST)) {
      try {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
        });
      } catch (err: any) {
        console.error("[Email Service] Failed to initialize SMTP transport:", err);
        throw err;
      }
    } else {
      try {
        // Create an Ethereal test account on the fly for development
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[Email Service] Using Ethereal Email test account: ${testAccount.user}`);
      } catch (err: any) {
        console.warn(
          `[Email Service] Failed to initialize Ethereal test account (${err?.message || err}). Falling back to JSON transport.`
        );
        transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }
  }
  return transporter;
}

export async function sendAwaitingApprovalEmail(
  userEmail: string,
  paperTitle: string,
  paperId: string,
  options?: AwaitingApprovalEmailOptions
): Promise<SendEmailResult> {
  try {
    const mailer = await getTransporter();
    const from = getSenderAddress(options?.fromEmail);

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

    const info = await mailer.sendMail({
      from,
      to: userEmail,
      subject,
      text,
      html,
    });

    const previewUrl = getSafeTestMessageUrl(mailer, info);

    console.log(
      `[Email Service] Awaiting Approval email sent to ${userEmail}. Message ID: ${info?.messageId || "N/A"}`
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
    console.error(`[Email Service] Error sending Awaiting Approval email to ${userEmail}:`, error);

    if (options?.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}
