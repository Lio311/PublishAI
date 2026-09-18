import nodemailer from "nodemailer";
import { getTransporter } from "./notification-service";

export async function sendSubmissionSuccessEmail(userEmail: string, paperTitle: string, postUrl: string) {
  const subject = `Your paper "${paperTitle}" was successfully submitted`;
  const html = `
    <h2>Submission Successful</h2>
    <p>We're happy to let you know that your paper <strong>${paperTitle}</strong> was successfully submitted to the journal.</p>
    <p>You can view your submission here: <a href="${postUrl}">${postUrl}</a></p>
    <p><br>Best regards,<br>The PublishAI Team</p>
  `;

  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: '"Publish AI" <noreply@publish-ai.com>',
    to: userEmail,
    subject,
    html,
  });

  console.log(`[Email Service] Success email sent to ${userEmail}. Message ID: ${info.messageId}`);
  
  if (info.messageId && (mailer.transporter.name === 'smtp.ethereal.email' || (mailer.options as any).host === 'smtp.ethereal.email')) {
    console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

export async function sendSubmissionFailedEmail(userEmail: string, paperTitle: string, errorMsg: string) {
  const subject = `Action Required: Submission failed for "${paperTitle}"`;
  const html = `
    <h2>Submission Failed</h2>
    <p>We attempted to submit your paper <strong>${paperTitle}</strong>, but encountered an error.</p>
    <p>Error details: <code>${errorMsg}</code></p>
    <p>Please check your journal credentials and connection settings in the system, and try again.</p>
    <p><br>Best regards,<br>The PublishAI Team</p>
  `;

  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: '"Publish AI" <noreply@publish-ai.com>',
    to: userEmail,
    subject,
    html,
  });

  console.log(`[Email Service] Failed email sent to ${userEmail}. Message ID: ${info.messageId}`);
  
  if (info.messageId && (mailer.transporter.name === 'smtp.ethereal.email' || (mailer.options as any).host === 'smtp.ethereal.email')) {
    console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
