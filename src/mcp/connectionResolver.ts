import { db } from "@/services/db";
import { journalConnections } from "@/services/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/services/security/encryption";
import { McpServerContext } from "./types";
import { isSafeTargetUrl } from "./utils";

export interface ResolvedOjsCredentials {
  siteUrl: string;
  apiToken: string;
}

export interface ResolvedWordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

/**
 * Resolves OJS credentials securely.
 * If connectionId is provided, checks authorization ensuring it belongs to the authenticated user.
 * If direct credentials are provided, validates target URL for SSRF protection and checks client permissions.
 */
export async function resolveOjsCredentials(
  params: { connectionId?: number; siteUrl?: string; apiToken?: string },
  context?: McpServerContext
): Promise<ResolvedOjsCredentials> {
  if (params.connectionId) {
    if (context?.requireAuth && !context?.userId) {
      throw new Error("Unauthorized: Access to saved journal connections requires an authenticated user session.");
    }

    const whereClause = context?.userId
      ? and(eq(journalConnections.id, params.connectionId), eq(journalConnections.userId, context.userId))
      : eq(journalConnections.id, params.connectionId);

    const conn = await db.query.journalConnections.findFirst({
      where: whereClause,
    });

    if (!conn) {
      throw new Error(
        `Journal connection #${params.connectionId} was not found or you do not have permission to access it.`
      );
    }

    if (conn.platform !== "ojs") {
      throw new Error(`Connection #${params.connectionId} is configured for '${conn.platform}', expected 'ojs'.`);
    }

    const apiToken = decrypt(conn.encryptedUsername);
    return {
      siteUrl: conn.siteUrl,
      apiToken,
    };
  }

  if (params.siteUrl && params.apiToken) {
    const safeCheck = isSafeTargetUrl(params.siteUrl);
    if (!safeCheck.valid) {
      throw new Error(`Security validation failed for siteUrl: ${safeCheck.error}`);
    }

    if (context?.requireAuth && !context?.userId && !context?.apiKey) {
      throw new Error("Unauthorized: Direct credential tool calls require client authentication.");
    }

    return {
      siteUrl: params.siteUrl,
      apiToken: params.apiToken,
    };
  }

  throw new Error("Missing connection credentials: provide either 'connectionId' or both 'siteUrl' and 'apiToken'.");
}

/**
 * Resolves WordPress credentials securely.
 * If connectionId is provided, checks authorization ensuring it belongs to the authenticated user.
 * If direct credentials are provided, validates target URL for SSRF protection and checks client permissions.
 */
export async function resolveWordPressCredentials(
  params: { connectionId?: number; siteUrl?: string; username?: string; appPassword?: string },
  context?: McpServerContext
): Promise<ResolvedWordPressCredentials> {
  if (params.connectionId) {
    if (context?.requireAuth && !context?.userId) {
      throw new Error("Unauthorized: Access to saved journal connections requires an authenticated user session.");
    }

    const whereClause = context?.userId
      ? and(eq(journalConnections.id, params.connectionId), eq(journalConnections.userId, context.userId))
      : eq(journalConnections.id, params.connectionId);

    const conn = await db.query.journalConnections.findFirst({
      where: whereClause,
    });

    if (!conn) {
      throw new Error(
        `Journal connection #${params.connectionId} was not found or you do not have permission to access it.`
      );
    }

    if (conn.platform !== "wordpress") {
      throw new Error(`Connection #${params.connectionId} is configured for '${conn.platform}', expected 'wordpress'.`);
    }

    const username = decrypt(conn.encryptedUsername);
    const appPassword = decrypt(conn.encryptedPassword);

    return {
      siteUrl: conn.siteUrl,
      username,
      appPassword,
    };
  }

  if (params.siteUrl && params.username && params.appPassword) {
    const safeCheck = isSafeTargetUrl(params.siteUrl);
    if (!safeCheck.valid) {
      throw new Error(`Security validation failed for siteUrl: ${safeCheck.error}`);
    }

    if (context?.requireAuth && !context?.userId && !context?.apiKey) {
      throw new Error("Unauthorized: Direct credential tool calls require client authentication.");
    }

    return {
      siteUrl: params.siteUrl,
      username: params.username,
      appPassword: params.appPassword,
    };
  }

  throw new Error(
    "Missing connection credentials: provide either 'connectionId' or 'siteUrl', 'username', and 'appPassword'."
  );
}
