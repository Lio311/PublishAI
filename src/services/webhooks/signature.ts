import crypto from "crypto";

/**
 * Validates HMAC SHA-256 signature against raw request body using constant-time comparison.
 * Protects against timing attacks.
 */
export function verifyHmacSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!secret || !signature) return false;

  try {
    // Normalise signature (strip leading algorithm identifier, e.g. "sha256=")
    const cleanSignature = signature.trim().startsWith("sha256=")
      ? signature.trim().slice(7)
      : signature.trim();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    const sigBuffer = Buffer.from(cleanSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error("[WebhookSignature] Error verifying HMAC signature:", err);
    return false;
  }
}

/**
 * Validates a shared webhook secret token using constant-time comparison.
 */
export function verifySecretToken(
  providedSecret: string | null | undefined,
  configuredSecret: string | null | undefined
): boolean {
  if (!configuredSecret || !providedSecret) return false;

  try {
    const provBuffer = Buffer.from(providedSecret.trim());
    const confBuffer = Buffer.from(configuredSecret.trim());

    if (provBuffer.length !== confBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(provBuffer, confBuffer);
  } catch (err) {
    console.error("[WebhookSignature] Error verifying secret token:", err);
    return false;
  }
}

/**
 * Verifies email webhook request signatures.
 * Supports:
 * 1. HMAC SHA-256 via 'x-webhook-signature', 'x-signature-sha256', or 'x-hub-signature-256'
 * 2. Shared secret via 'x-webhook-secret' header
 * 3. Bearer token via 'authorization' header
 */
export function verifyEmailWebhookSignature(
  req: Request,
  rawBody: string
): { isValid: boolean; reason?: string } {
  const webhookSecret =
    process.env.EMAIL_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    process.env.MAILGUN_SIGNING_KEY;

  // In production, a webhook secret must be configured
  if (process.env.NODE_ENV === "production" && !webhookSecret) {
    console.error(
      "[WebhookSecurity] Production warning: EMAIL_WEBHOOK_SECRET or WEBHOOK_SECRET is not configured. Rejecting request."
    );
    return {
      isValid: false,
      reason: "Webhook verification secret not configured on server",
    };
  }

  // If in dev/test and no secret is configured, allow request with a warning
  if (!webhookSecret) {
    return { isValid: true };
  }

  // 1. Check HMAC signature headers
  const signatureHeader =
    req.headers.get("x-webhook-signature") ||
    req.headers.get("x-signature-sha256") ||
    req.headers.get("x-hub-signature-256") ||
    req.headers.get("x-signature");

  if (signatureHeader) {
    if (verifyHmacSignature(rawBody, signatureHeader, webhookSecret)) {
      return { isValid: true };
    }
  }

  // 2. Check direct secret header
  const secretHeader = req.headers.get("x-webhook-secret");
  if (secretHeader && verifySecretToken(secretHeader, webhookSecret)) {
    return { isValid: true };
  }

  // 3. Check Bearer token authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (verifySecretToken(token, webhookSecret)) {
      return { isValid: true };
    }
  }

  return {
    isValid: false,
    reason: "Invalid or missing webhook cryptographic signature",
  };
}
