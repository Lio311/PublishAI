import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkAndRecordWebhookEvent } from "@/services/webhooks/idempotency";
import { inngest } from "@/inngest/client";
import { errorMessage } from "@/services/utils/errors";

const HANDLED_STRIPE_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

function getCryptoProvider(): Stripe.CryptoProvider | undefined {
  if (typeof Stripe.createNodeCryptoProvider === "function") {
    try {
      return Stripe.createNodeCryptoProvider();
    } catch {
      // Fallback for non-standard environments
    }
  }

  try {
    if (
      globalThis.crypto?.subtle &&
      typeof Stripe.createSubtleCryptoProvider === "function"
    ) {
      return Stripe.createSubtleCryptoProvider(globalThis.crypto.subtle);
    }
  } catch {}

  return undefined;
}

function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey && process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY environment variable is required in production.");
  }
  // Only used to verify webhook signatures, so no API version pin is needed.
  return new Stripe(secretKey || "sk_test_dummy_key");
}

export async function POST(request: Request) {
  const stripe = getStripeInstance();
  const signature = request.headers.get("stripe-signature");

  // 1. Ensure signature header is provided
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (process.env.NODE_ENV === "production" && !webhookSecret) {
    console.error(
      "[StripeWebhook] STRIPE_WEBHOOK_SECRET is not configured in production."
    );
    return NextResponse.json(
      { error: "Webhook verification secret not configured on server" },
      { status: 500 }
    );
  }

  const secretToUse = webhookSecret || "whsec_test_secret";
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch (readErr) {
    console.error("[StripeWebhook] Failed to read request body:", readErr);
    return NextResponse.json(
      { error: "Unable to read request payload" },
      { status: 400 }
    );
  }

  // 2. Cryptographic signature verification
  let event: Stripe.Event;
  try {
    const cryptoProvider = getCryptoProvider();
    if (cryptoProvider) {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        secretToUse,
        undefined,
        cryptoProvider
      );
    } else {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        secretToUse
      );
    }
  } catch (err) {
    console.warn(
      `[StripeWebhook] Cryptographic signature verification failed: ${errorMessage(err)}`
    );
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage(err)}` },
      { status: 400 }
    );
  }

  // 3. Idempotency Check
  const eventId = event.id;
  const idempotency = await checkAndRecordWebhookEvent(eventId);
  if (idempotency.isDuplicate) {
    return NextResponse.json(
      {
        received: true,
        duplicate: true,
        eventId,
        message: "Stripe event already processed",
      },
      { status: 200 }
    );
  }

  // 4. Handle unknown or unhandled event types gracefully
  if (!HANDLED_STRIPE_EVENTS.has(event.type)) {
    return NextResponse.json(
      {
        received: true,
        handled: false,
        type: event.type,
        reason: `Event type '${event.type}' is acknowledged but not processed`,
      },
      { status: 200 }
    );
  }

  // 5. Delegate processing to Inngest background queue
  try {
    await inngest.send({
      name: "stripe/event-received",
      data: {
        id: event.id,
        type: event.type,
        data: event.data.object as unknown as Record<string, unknown>,
        created: event.created,
      },
    });

    return NextResponse.json(
      {
        received: true,
        queued: true,
        eventId: event.id,
        type: event.type,
      },
      { status: 200 }
    );
  } catch (inngestErr) {
    console.error(
      "[StripeWebhook] Failed to dispatch event to Inngest, executing fallback:",
      inngestErr
    );

    // Fallback: If Inngest is offline, execute safe database update directly
    try {
      const { db } = await import("@/services/db");
      const { users } = await import("@/services/db/schema");
      const { eq } = await import("drizzle-orm");

      const idOf = (ref: string | { id: string } | null | undefined) => (typeof ref === "string" ? ref : ref?.id);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const customerId = idOf(session.customer);
        const subscriptionId = idOf(session.subscription);

        if (session.client_reference_id) {
          await db
            .update(users)
            .set({
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
            })
            .where(eq(users.id, session.client_reference_id));
        }
      } else if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        const subscription = event.data.object;
        const customerId = idOf(subscription.customer);
        const firstItem = subscription.items?.data?.[0];
        if (customerId) {
          await db
            .update(users)
            .set({
              stripeSubscriptionId: subscription.id,
              stripePriceId: firstItem?.price?.id,
              // The billing period lives on subscription items in current Stripe API versions.
              stripeCurrentPeriodEnd: firstItem?.current_period_end
                ? new Date(firstItem.current_period_end * 1000)
                : undefined,
            })
            .where(eq(users.stripeCustomerId, customerId));
        }
      } else if (event.type === "customer.subscription.deleted") {
        const customerId = idOf(event.data.object.customer);
        if (customerId) {
          await db
            .update(users)
            .set({
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
            })
            .where(eq(users.stripeCustomerId, customerId));
        }
      }

      return NextResponse.json(
        {
          received: true,
          queued: false,
          fallbackProcessed: true,
          eventId: event.id,
        },
        { status: 200 }
      );
    } catch (fallbackErr) {
      console.error("[StripeWebhook] Fallback processing failed:", fallbackErr);
      return NextResponse.json(
        { error: "Error processing Stripe webhook" },
        { status: 500 }
      );
    }
  }
}
