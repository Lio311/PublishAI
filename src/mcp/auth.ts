import { NextRequest } from "next/server";
import { auth } from "@/app/auth";

export interface AuthenticatedMcpRequest {
  authenticated: boolean;
  userId?: string;
  isService?: boolean;
  error?: string;
}

/**
 * Authenticates incoming MCP HTTP requests (GET for SSE streams and POST for message delivery).
 * Supports NextAuth sessions, Authorization: Bearer <token>, x-api-key header, or query parameters.
 */
export async function authenticateMcpRequest(req: NextRequest): Promise<AuthenticatedMcpRequest> {
  // 1. Check NextAuth session
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        authenticated: true,
        userId: session.user.id,
      };
    }
  } catch {
    // Session check failed, proceed to header/query checks
  }

  // 2. Check Authorization header (Bearer token) or x-api-key header
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-api-key");

  // 3. Check query parameters (for standard browser EventSource connections)
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token") || url.searchParams.get("apiKey");

  const providedKey =
    apiKeyHeader ||
    tokenParam ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null);

  const configuredKey =
    process.env.MCP_API_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (providedKey && configuredKey && providedKey === configuredKey) {
    return {
      authenticated: true,
      isService: true,
      userId: "mcp-service-client",
    };
  }

  // 4. In local development only, allow opt-in bypass if explicitly enabled
  if (
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_UNAUTHENTICATED_MCP === "true"
  ) {
    return {
      authenticated: true,
      userId: "dev-local-user",
    };
  }

  return {
    authenticated: false,
    error: "Unauthorized: A valid NextAuth session, Bearer token, or API key is required to access MCP endpoints.",
  };
}
