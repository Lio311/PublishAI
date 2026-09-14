import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", 
  auth: {
    user: process.env.SMTP_USER || "user",
    pass: process.env.SMTP_PASS || "pass",
  },
});

export async function sendPaperStatusEmail(to: string, paperTitle: string, status: string) {
  if (!process.env.SMTP_HOST) {
    console.warn("SMTP_HOST not set. Mocking email send to:", to);
    return { messageId: "mock-id" };
  }

  const info = await transporter.sendMail({
    from: '"PublishAI" <notifications@publishai.example.com>',
    to,
    subject: `Update on your paper: ${paperTitle}`,
    html: `
      <div>
        <h2>Your manuscript status has changed</h2>
        <p>Your paper <strong>${paperTitle}</strong> is now: <strong>${status}</strong>.</p>
        <p>Log in to your PublishAI dashboard to review the changes.</p>
      </div>
    `,
  });

  return info;
}
