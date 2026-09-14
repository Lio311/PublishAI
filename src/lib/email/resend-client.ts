import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export async function sendPaperStatusEmail(to: string, paperTitle: string, status: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set. Mocking email send to:", to);
    return { id: "mock-id" };
  }

  return await resend.emails.send({
    from: "PublishAI <notifications@publishai.example.com>",
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
}
