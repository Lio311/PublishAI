import { createOjsMcpServer } from "@/mcp/ojsMcpServer";
import { createMcpRouteHandler } from "@/mcp/routeHandler";

export const { GET, POST } = createMcpRouteHandler(createOjsMcpServer, "ojs");
