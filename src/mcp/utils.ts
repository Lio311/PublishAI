import { redactApiKeys } from "@/services/ai/promptSanitizer";
import { McpToolResult } from "./types";

/**
 * Formats a successful response for MCP tool call.
 */
export function formatMcpSuccess(data: unknown): McpToolResult {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

/**
 * Formats an error response for MCP tool call, ensuring secrets and API keys are redacted.
 */
export function formatMcpError(error: unknown, fallbackMessage = "Operation failed"): McpToolResult {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = fallbackMessage;
  }

  const safeMessage = redactApiKeys(message);

  return {
    content: [
      {
        type: "text",
        text: safeMessage.startsWith("Error:") ? safeMessage : `Error: ${safeMessage}`,
      },
    ],
    isError: true,
  };
}

/**
 * Validates a target URL against SSRF (Server-Side Request Forgery) attacks.
 * Rejects private, local, multicast, loopback, and cloud metadata addresses.
 */
export function isSafeTargetUrl(rawUrl: string): { valid: boolean; error?: string; url?: URL } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL is required and must be a string." };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: `Invalid URL format: '${rawUrl}'.` };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: `Protocol '${parsed.protocol}' is forbidden. Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Strip IPv6 brackets if present
  const unbracketedHost = hostname.replace(/^\[|\]$/g, "");

  // Check for localhost / loopback / local domains
  if (
    unbracketedHost === "localhost" ||
    unbracketedHost === "127.0.0.1" ||
    unbracketedHost === "::1" ||
    unbracketedHost === "0.0.0.0" ||
    unbracketedHost.endsWith(".localhost") ||
    unbracketedHost.endsWith(".local") ||
    unbracketedHost.endsWith(".internal")
  ) {
    return { valid: false, error: "Access to loopback, localhost, or internal hostnames is forbidden." };
  }

  // Check for AWS / GCP / Azure metadata endpoints
  if (
    unbracketedHost === "169.254.169.254" ||
    unbracketedHost.startsWith("169.254.") ||
    unbracketedHost === "metadata.google.internal"
  ) {
    return { valid: false, error: "Access to cloud instance metadata services is forbidden." };
  }

  // IPv4 Private subnets validation
  const ipv4Match = unbracketedHost.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const o1 = parseInt(ipv4Match[1], 10);
    const o2 = parseInt(ipv4Match[2], 10);
    const o3 = parseInt(ipv4Match[3], 10);
    const o4 = parseInt(ipv4Match[4], 10);

    if ([o1, o2, o3, o4].some((octet) => octet < 0 || octet > 255)) {
      return { valid: false, error: "Invalid IPv4 address representation." };
    }

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) {
      return { valid: false, error: "Access to loopback addresses (127.0.0.0/8) is forbidden." };
    }

    // 10.0.0.0/8 (Private)
    if (o1 === 10) {
      return { valid: false, error: "Access to private network range 10.0.0.0/8 is forbidden." };
    }

    // 172.16.0.0/12 (Private: 172.16.x.x - 172.31.x.x)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) {
      return { valid: false, error: "Access to private network range 172.16.0.0/12 is forbidden." };
    }

    // 192.168.0.0/16 (Private)
    if (o1 === 192 && o2 === 168) {
      return { valid: false, error: "Access to private network range 192.168.0.0/16 is forbidden." };
    }

    // 0.0.0.0/8 (Current network)
    if (o1 === 0) {
      return { valid: false, error: "Access to current network (0.0.0.0/8) is forbidden." };
    }

    // 224.0.0.0/4 (Multicast)
    if (o1 >= 224 && o1 <= 239) {
      return { valid: false, error: "Access to multicast addresses is forbidden." };
    }

    // 240.0.0.0/4 (Reserved)
    if (o1 >= 240) {
      return { valid: false, error: "Access to reserved IP addresses is forbidden." };
    }
  }

  return { valid: true, url: parsed };
}
