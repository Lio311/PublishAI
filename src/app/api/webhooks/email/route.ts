import { NextResponse } from 'next/server';
import { processIncomingReviewEmail } from '@/services/emailService';

export async function POST(request: Request) {
  try {
    // Depending on the email provider (SendGrid, Mailgun, etc.), 
    // the content type might be application/json or multipart/form-data.
    // For scaffolding, we assume a JSON payload.
    const payload = await request.json();

    // Standardize extraction based on common webhook formats
    const sender = payload.sender || payload.from || '';
    const recipient = payload.recipient || payload.to || '';
    const subject = payload.subject || '';
    const textBody = payload.text || payload.body || payload.textBody || '';
    const attachments = payload.attachments || [];

    if (!sender) {
      return NextResponse.json(
        { error: 'Missing sender in webhook payload' },
        { status: 400 }
      );
    }

    const emailData = {
      sender,
      recipient,
      subject,
      body: textBody,
      attachments,
    };

    // Process the email
    const result = await processIncomingReviewEmail(emailData);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error handling email webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while processing email' },
      { status: 500 }
    );
  }
}
