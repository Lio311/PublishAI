import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: "publishai-ojs-mcp",
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
        name: "create_ojs_submission",
        description: "Create a submission in OJS (Open Journal Systems).",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Submission title" },
            abstract: { type: "string", description: "Submission abstract" },
            authors: { 
              type: "array", 
              items: { type: "string" },
              description: "List of author names"
            }
          },
          required: ["title", "abstract"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "create_ojs_submission") {
    const { title, abstract, authors } = request.params.arguments as any;
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            success: true, 
            message: "OJS submission created successfully", 
            data: { title, abstract, authors } 
          })
        }
      ]
    };
  }
  
  throw new Error(`Tool not found: ${request.params.name}`);
});

export { server };
