import { sendEmail } from "./nodemailer-client"; // Assuming this exists or similar

export async function sendSubmissionSuccessEmail(userEmail: string, paperTitle: string, postUrl: string) {
  const subject = `Your paper "${paperTitle}" was successfully submitted`;
  const html = `
    <h2>Submission Successful</h2>
    <p>We're happy to let you know that your paper <strong>${paperTitle}</strong> was successfully submitted to the journal.</p>
    <p>You can view your submission here: <a href="${postUrl}">${postUrl}</a></p>
    <p><br>Best regards,<br>The PublishAI Team</p>
  `;

  // Commented out to prevent actual sending if nodemailer isn't fully configured
  // await sendEmail({ to: userEmail, subject, html });
  console.log(`[Email Mock] Sent to ${userEmail}: ${subject}`);
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

  // await sendEmail({ to: userEmail, subject, html });
  console.log(`[Email Mock] Sent to ${userEmail}: ${subject}`);
}
