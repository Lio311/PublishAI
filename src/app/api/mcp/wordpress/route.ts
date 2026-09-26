import { createWordpressMcpServer } from "@/mcp/wordpressMcpServer";
import { createMcpRouteHandler } from "@/mcp/routeHandler";

export const { GET, POST } = createMcpRouteHandler(createWordpressMcpServer, "wordpress");
