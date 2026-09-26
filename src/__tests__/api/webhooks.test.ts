import crypto from "crypto";

// Ensure WebCrypto subtle is available in JSDOM test environment
if (!globalThis.crypto?.subtle && crypto.webcrypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: crypto.webcrypto,
    writable: true,
    configurable: true,
  });
}

import { POST as emailWebhookHandler } from "@/app/api/webhooks/email/route";
import { POST as stripeWebhookHandler } from "@/app/api/webhooks/stripe/route";
import { inngest } from "@/inngest/client";
import { resetWebhookIdempotency } from "@/services/webhooks/idempotency";

// Mock Inngest client send
jest.mock("@/inngest/client", () => ({
  inngest: {
    send: jest.fn().mockResolvedValue([{ ids: ["inngest_event_123"] }]),
  },
}));

// Mock DB
jest.mock("@/services/db", () => ({
  db: {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ id: 1 }]),
    query: {
      submissions: {
        findFirst: jest.fn().mockResolvedValue({ id: 123, paperId: 456 }),
      },
      users: {
        findFirst: jest.fn().mockResolvedValue({ id: "usr_123", email: "user@example.com" }),
      },
    },
  },
}));

function createSignedEmailRequest(
  bodyObj: any,
  secret: string,
  extraHeaders: Record<string, string> = {}
): Request {
  const rawBody = JSON.stringify(bodyObj);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  return new Request("https://publish.ai/api/webhooks/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": `sha256=${signature}`,
      ...extraHeaders,
    },
    body: rawBody,
  });
}

function createStripeSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("Webhooks API Security & Reliability Audit", () => {
  const originalEnv = process.env;
  const TEST_SECRET = "test_webhook_signing_secret_xyz123";

  beforeEach(() => {
    jest.clearAllMocks();
    resetWebhookIdempotency();
    process.env = {
      ...originalEnv,
      EMAIL_WEBHOOK_SECRET: TEST_SECRET,
      STRIPE_WEBHOOK_SECRET: TEST_SECRET,
      STRIPE_SECRET_KEY: "sk_test_1234567890",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ═══════════════════════════════════════════════════════
  // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION
  // ═══════════════════════════════════════════════════════
  describe("Cryptographic Signature Verification", () => {
    it("rejects email webhook when signature is missing (when secret configured)", async () => {
      const payload = { sender: "editor@nature.com", subject: "Review", body: "Accepted" };
      const req = new Request("https://publish.ai/api/webhooks/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await emailWebhookHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("signature");
    });

    it("rejects email webhook when HMAC signature is forged/invalid", async () => {
      const payload = { sender: "editor@nature.com", subject: "Review", body: "Accepted" };
      const req = new Request("https://publish.ai/api/webhooks/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-signature": "sha256=invalid_deadbeef_signature_00000000000000000000000000000000",
        },
        body: JSON.stringify(payload),
      });

      const res = await emailWebhookHandler(req);
      expect(res.status).toBe(401);
    });

    it("accepts email webhook with valid HMAC-SHA256 signature", async () => {
      const payload = {
        sender: "editor@nature.com",
        subject: "Review of Manuscript #99",
        body: "Major revisions requested.",
      };
      const req = createSignedEmailRequest(payload, TEST_SECRET);

      const res = await emailWebhookHandler(req);
      expect([200, 202]).toContain(res.status);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queued).toBe(true);
    });

    it("accepts email webhook with valid x-webhook-secret token", async () => {
      const payload = {
        sender: "editor@nature.com",
        subject: "Review of Manuscript #100",
        body: "Minor revisions.",
      };
      const req = new Request("https://publish.ai/api/webhooks/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": TEST_SECRET,
        },
        body: JSON.stringify(payload),
      });

      const res = await emailWebhookHandler(req);
      expect([200, 202]).toContain(res.status);
    });

    it("rejects stripe webhook when stripe-signature header is missing", async () => {
      const req = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "evt_123", type: "checkout.session.completed" }),
      });

      const res = await stripeWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing stripe-signature header");
    });

    it("rejects stripe webhook when signature is invalid", async () => {
      const body = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
      const req = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "t=12345,v1=invalid_signature_hex",
        },
        body,
      });

      const res = await stripeWebhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("signature verification failed");
    });

    it("accepts stripe webhook with valid Stripe signature", async () => {
      const eventPayload = {
        id: "evt_valid_checkout_1",
        object: "event",
        type: "checkout.session.completed",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "cs_123",
            customer: "cus_abc",
            client_reference_id: "usr_123",
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const stripeSig = createStripeSignature(rawBody, TEST_SECRET);

      const req = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": stripeSig,
        },
        body: rawBody,
      });

      const res = await stripeWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.queued).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 2. ERROR HANDLING FOR UNKNOWN & TELEMETRY EVENT TYPES
  // ═══════════════════════════════════════════════════════
  describe("Handling Unknown & Telemetry Event Types", () => {
    it("safely handles email provider ping/test events without error", async () => {
      const payload = { type: "ping" };
      const req = createSignedEmailRequest(payload, TEST_SECRET);

      const res = await emailWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.status).toBe("pong");
    });

    it("safely acknowledges email delivery/telemetry events without failing", async () => {
      const payload = {
        event: "delivered",
        email: "author@university.edu",
        timestamp: 1620000000,
      };
      const req = createSignedEmailRequest(payload, TEST_SECRET);

      const res = await emailWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.handled).toBe(false);
      expect(json.reason).toContain("Telemetry event");
    });

    it("safely acknowledges unknown email event types without throwing 500", async () => {
      const payload = {
        type: "unrecognized.provider.event.custom_v2",
        data: { random: true },
      };
      const req = createSignedEmailRequest(payload, TEST_SECRET);

      const res = await emailWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.handled).toBe(false);
      expect(json.reason).toContain("Unknown or unhandled event type");
    });

    it("safely handles unhandled Stripe event types with 200 OK", async () => {
      const eventPayload = {
        id: "evt_tax_id_created_1",
        object: "event",
        type: "customer.tax_id.created", // Unhandled in our billing flow
        created: Math.floor(Date.now() / 1000),
        data: { object: { id: "txi_123" } },
      };
      const rawBody = JSON.stringify(eventPayload);
      const stripeSig = createStripeSignature(rawBody, TEST_SECRET);

      const req = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": stripeSig,
        },
        body: rawBody,
      });

      const res = await stripeWebhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.handled).toBe(false);
      expect(json.type).toBe("customer.tax_id.created");
    });
  });

  // ═══════════════════════════════════════════════════════
  // 3. IDEMPOTENCY & DEDUPLICATION
  // ═══════════════════════════════════════════════════════
  describe("Idempotency (Duplicate Webhook Prevention)", () => {
    it("email webhook acknowledges duplicates and does not re-enqueue to Inngest", async () => {
      const payload = {
        id: "email_msg_unique_abc_1",
        sender: "editor@science.org",
        subject: "Review round 1",
        body: "Attached review report comments.",
      };

      // First delivery
      const req1 = createSignedEmailRequest(payload, TEST_SECRET);
      const res1 = await emailWebhookHandler(req1);
      expect([200, 202]).toContain(res1.status);
      expect(inngest.send).toHaveBeenCalledTimes(1);

      // Second delivery with identical event ID
      const req2 = createSignedEmailRequest(payload, TEST_SECRET);
      const res2 = await emailWebhookHandler(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.duplicate).toBe(true);
      expect(json2.message).toContain("already processed");

      // Inngest send was NOT called again!
      expect(inngest.send).toHaveBeenCalledTimes(1);
    });

    it("stripe webhook acknowledges duplicates and does not re-enqueue to Inngest", async () => {
      const eventPayload = {
        id: "evt_duplicate_test_99",
        object: "event",
        type: "customer.subscription.updated",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            current_period_end: 1735689600,
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const stripeSig = createStripeSignature(rawBody, TEST_SECRET);

      // First delivery
      const req1 = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": stripeSig,
        },
        body: rawBody,
      });
      const res1 = await stripeWebhookHandler(req1);
      expect(res1.status).toBe(200);
      expect(inngest.send).toHaveBeenCalledTimes(1);

      // Second delivery with same evt_duplicate_test_99
      const req2 = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": stripeSig,
        },
        body: rawBody,
      });
      const res2 = await stripeWebhookHandler(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.duplicate).toBe(true);

      // Inngest send was NOT called again!
      expect(inngest.send).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. DELEGATION TO INNGEST BACKGROUND QUEUES
  // ═══════════════════════════════════════════════════════
  describe("Asynchronous Delegation to Inngest", () => {
    it("dispatches email/review-received event to Inngest with full payload metadata", async () => {
      const payload = {
        id: "email_inngest_test_42",
        sender: "reviewer@cell.com",
        recipient: "bot@publish.ai",
        subject: "Paper 42 Review",
        body: "The manuscript is well written.",
        attachments: [{ filename: "review.pdf", contentType: "application/pdf" }],
      };

      const req = createSignedEmailRequest(payload, TEST_SECRET);
      const res = await emailWebhookHandler(req);

      expect([200, 202]).toContain(res.status);
      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "email/review-received",
          data: expect.objectContaining({
            id: "email_inngest_test_42",
            sender: "reviewer@cell.com",
            recipient: "bot@publish.ai",
            subject: "Paper 42 Review",
          }),
        })
      );
    });

    it("dispatches stripe/event-received event to Inngest for handled events", async () => {
      const eventPayload = {
        id: "evt_sub_deleted_88",
        object: "event",
        type: "customer.subscription.deleted",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "sub_canceled_123",
            customer: "cus_customer_123",
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const stripeSig = createStripeSignature(rawBody, TEST_SECRET);

      const req = new Request("https://publish.ai/api/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": stripeSig,
        },
        body: rawBody,
      });

      const res = await stripeWebhookHandler(req);
      expect(res.status).toBe(200);
      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "stripe/event-received",
          data: expect.objectContaining({
            id: "evt_sub_deleted_88",
            type: "customer.subscription.deleted",
          }),
        })
      );
    });
  });
});
