import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: "publishai-wordpress-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_wp_draft",
        description: "Create a draft post in WordPress.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Post title" },
            content: { type: "string", description: "Post HTML content" }
          },
          required: ["title", "content"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "create_wp_draft") {
    const { title, content } = request.params.arguments as any;
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            success: true, 
            message: "WordPress draft created successfully", 
            data: { title, content } 
          })
        }
      ]
    };
  }
  
  throw new Error(`Tool not found: ${request.params.name}`);
});

export { server };
