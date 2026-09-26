import { inngest } from "../client";
import { stripeEventReceivedEvent } from "../events";
import { db } from "@/services/db";
import { users } from "@/services/db/schema";
import { eq } from "drizzle-orm";

export const processStripeWebhook = inngest.createFunction(
  {
    id: "process-stripe-webhook",
    triggers: [stripeEventReceivedEvent],
    concurrency: {
      key: "event.data.id",
      limit: 1,
    },
    idempotency: "event.data.id",
    retries: 3,
  },
  async ({ event, step }) => {
    const { id, type, data } = event.data;

    switch (type) {
      case "checkout.session.completed": {
        await step.run("handle-checkout-session-completed", async () => {
          const customerId = data.customer as string | undefined;
          const clientReferenceId = data.client_reference_id as string | undefined;
          const subscriptionId = data.subscription as string | undefined;
          const userEmail =
            (data.customer_email as string | undefined) ||
            (data.customer_details?.email as string | undefined);

          if (clientReferenceId) {
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId || undefined,
                stripeSubscriptionId: subscriptionId || undefined,
              })
              .where(eq(users.id, clientReferenceId));
          } else if (userEmail) {
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId || undefined,
                stripeSubscriptionId: subscriptionId || undefined,
              })
              .where(eq(users.email, userEmail));
          }
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await step.run("handle-subscription-updated", async () => {
          const customerId = data.customer as string | undefined;
          const subscriptionId = data.id as string | undefined;
          const priceId = data.items?.data?.[0]?.price?.id as string | undefined;
          const currentPeriodEndSec = data.current_period_end as number | undefined;
          const currentPeriodEnd = currentPeriodEndSec
            ? new Date(currentPeriodEndSec * 1000)
            : undefined;

          if (customerId) {
            await db
              .update(users)
              .set({
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId || undefined,
                stripeCurrentPeriodEnd: currentPeriodEnd,
              })
              .where(eq(users.stripeCustomerId, customerId));
          }
        });
        break;
      }

      case "customer.subscription.deleted": {
        await step.run("handle-subscription-deleted", async () => {
          const customerId = data.customer as string | undefined;
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
        });
        break;
      }

      case "invoice.payment_succeeded": {
        await step.run("handle-invoice-payment-succeeded", async () => {
          console.log(`[StripeWebhook] Invoice payment succeeded: ${data.id}`);
        });
        break;
      }

      case "invoice.payment_failed": {
        await step.run("handle-invoice-payment-failed", async () => {
          console.warn(`[StripeWebhook] Invoice payment failed: ${data.id}`);
        });
        break;
      }

      default: {
        // Unknown or unhandled event types are acknowledged safely without errors
        return {
          success: true,
          handled: false,
          reason: `Unhandled event type: ${type}`,
          eventId: id,
        };
      }
    }

    return { success: true, handled: true, eventId: id, eventType: type };
  }
);
