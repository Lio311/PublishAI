import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyEmailWebhookSignature } from "@/services/webhooks/signature";
import { checkAndRecordWebhookEvent } from "@/services/webhooks/idempotency";
import { inngest } from "@/inngest/client";

// Set of recognized inbound email events
const INBOUND_EVENT_TYPES = new Set([
  "email.received",
  "inbound",
  "inbound_email",
  "email.incoming",
  "review.received",
]);

// Set of telemetry/lifecycle events that we safely acknowledge without processing
const TELEMETRY_EVENT_TYPES = new Set([
  "processed",
  "dropped",
  "delivered",
  "deferred",
  "bounce",
  "open",
  "click",
  "spamreport",
  "unsubscribe",
  "group_unsubscribe",
  "group_resubscribe",
  "email.sent",
  "email.delivered",
  "email.bounced",
  "email.complained",
  "opened",
  "clicked",
  "complained",
  "unsubscribed",
]);

export async function POST(request: Request) {
  try {
    // 1. Read raw body for cryptographic verification
    const rawBody = await request.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty webhook payload" },
        { status: 400 }
      );
    }

    // 2. Cryptographic signature verification
    const signatureCheck = verifyEmailWebhookSignature(request, rawBody);
    if (!signatureCheck.isValid) {
      return NextResponse.json(
        { error: signatureCheck.reason || "Unauthorized webhook signature" },
        { status: 401 }
      );
    }

    // Parse JSON payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Handle provider batches if array is sent (e.g. SendGrid Event Webhook)
    const eventItem = Array.isArray(payload) ? payload[0] : payload;
    if (!eventItem || typeof eventItem !== "object") {
      return NextResponse.json(
        { error: "Invalid event payload structure" },
        { status: 400 }
      );
    }

    const eventType = (
      eventItem.event ||
      eventItem.type ||
      eventItem.event_type ||
      ""
    ).toLowerCase();

    // 3. Handle ping / test challenge events
    if (eventType === "ping" || eventType === "test" || eventItem.ping) {
      return NextResponse.json({ received: true, status: "pong" }, { status: 200 });
    }

    // 4. Handle recognized telemetry events gracefully
    if (eventType && TELEMETRY_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        {
          received: true,
          handled: false,
          reason: `Telemetry event '${eventType}' acknowledged`,
        },
        { status: 200 }
      );
    }

    // 5. If explicit event type is provided and unknown (neither inbound nor telemetry)
    if (
      eventType &&
      !INBOUND_EVENT_TYPES.has(eventType) &&
      !eventItem.sender &&
      !eventItem.from
    ) {
      return NextResponse.json(
        {
          received: true,
          handled: false,
          reason: `Unknown or unhandled event type '${eventType}'`,
        },
        { status: 200 }
      );
    }

    // 6. Standardize extraction based on common webhook formats
    const sender = eventItem.sender || eventItem.from || "";
    const recipient = eventItem.recipient || eventItem.to || "";
    const subject = eventItem.subject || "";
    const textBody =
      eventItem.text || eventItem.body || eventItem.textBody || "";
    const attachments = eventItem.attachments || [];

    if (!sender) {
      return NextResponse.json(
        { error: "Missing sender in webhook payload" },
        { status: 400 }
      );
    }

    // 7. Idempotency Check
    const eventId =
      eventItem.messageId ||
      eventItem["message-id"] ||
      eventItem.sg_message_id ||
      eventItem.id ||
      crypto
        .createHash("sha256")
        .update(`${sender}:${recipient}:${subject}:${textBody}`)
        .digest("hex");

    const idempotency = await checkAndRecordWebhookEvent(eventId);
    if (idempotency.isDuplicate) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          message: "Webhook event already processed",
          eventId,
        },
        { status: 200 }
      );
    }

    const emailData = {
      id: eventId,
      sender,
      recipient,
      subject,
      body: textBody,
      attachments,
      timestamp: Date.now(),
    };

    // 8. Asynchronous Delegation to Inngest Queue
    // Instead of heavy synchronous PDF parsing in HTTP request, dispatch to Inngest
    try {
      await inngest.send({
        name: "email/review-received",
        data: emailData,
      });

      return NextResponse.json(
        {
          success: true,
          queued: true,
          eventId,
          message: "Email received and queued for asynchronous review processing",
        },
        { status: 202 }
      );
    } catch (inngestErr) {
      console.error(
        "[EmailWebhook] Inngest queue dispatch failed, falling back:",
        inngestErr
      );

      // Fallback: If Inngest is offline in development, process asynchronously via background promise
      // to avoid blocking the HTTP response
      import("@/services/emailService").then(({ processIncomingReviewEmail }) => {
        processIncomingReviewEmail(emailData).catch((err) =>
          console.error("[EmailWebhook] Fallback processing failed:", err)
        );
      });

      return NextResponse.json(
        {
          success: true,
          queued: false,
          eventId,
          message: "Email received and scheduled for background execution",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[EmailWebhook] Error handling email webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error while processing email webhook" },
      { status: 500 }
    );
  }
}
