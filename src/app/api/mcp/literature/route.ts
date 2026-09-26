import { createLiteratureMcpServer } from "@/mcp/literatureMcpServer";
import { createMcpRouteHandler } from "@/mcp/routeHandler";

export const { GET, POST } = createMcpRouteHandler(createLiteratureMcpServer, "literature");
