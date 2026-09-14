import nodemailer from "nodemailer";

/**
 * For local development and testing, we use Ethereal Email.
 * It catches all emails and generates a URL to view them, without sending real emails.
 */
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (!transporter) {
    if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create a test account on the fly for development
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
    }
  }
  return transporter;
}

export async function sendAwaitingApprovalEmail(userEmail: string, paperTitle: string, paperId: string) {
  const mailer = await getTransporter();
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/papers/${paperId}`;

  const info = await mailer.sendMail({
    from: '"Publish AI" <noreply@publish-ai.com>',
    to: userEmail,
    subject: `Your manuscript is ready for review: ${paperTitle}`,
    text: `Your manuscript "${paperTitle}" has finished the AI revision process.\nPlease review and approve the changes here: ${dashboardUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Manuscript Ready for Review</h2>
        <p>Hello,</p>
        <p>The AI revision process for your manuscript <strong>"${paperTitle}"</strong> has been successfully completed.</p>
        <p>Our agents have optimized the formatting, enhanced the academic tone, and generated a simulated peer review report.</p>
        <div style="margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review and Approve Changes
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If you have any questions, feel free to reply to this email.</p>
      </div>
    `,
  });

  console.log(`[Email Service] Awaiting Approval email sent to ${userEmail}. Message ID: ${info.messageId}`);
  
  if (info.messageId && (mailer.transporter.name === 'smtp.ethereal.email' || (mailer.options as any).host === 'smtp.ethereal.email')) {
    console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
  
  return info;
}
