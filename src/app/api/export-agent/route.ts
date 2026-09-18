import { NextRequest, NextResponse } from 'next/server';
import { createRepo, commit, spaceInfo } from '@huggingface/hub';

export async function POST(req: NextRequest) {
  try {
    const { paperId, code, datasets = [], requirements = [] } = await req.json();
    const hfToken = process.env.HF_TOKEN;

    if (!hfToken) {
      throw new Error("HF_TOKEN is not configured in the environment.");
    }

    const spaceName = `paper-agent-${paperId}`;
    const username = process.env.HF_USERNAME || 'publishai';
    const repoId = `${username}/${spaceName}`;

    // 1. Create the Space (ignore error if it already exists)
    try {
      await createRepo({
        repo: { type: 'space', name: spaceName },
        credentials: { accessToken: hfToken },
        sdk: 'docker',
      });
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }

    const mcpServerCode = `
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

# Original research code
${code}

server = Server("Paper-Agent-${paperId}")

@server.list_tools()
async def handle_list_tools() -> list:
    return [
        {
            "name": "run_analysis",
            "description": "Run the reproducible research analysis from the paper",
            "inputSchema": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list:
    if name == "run_analysis":
        try:
            # Assumes the user code defines a main() entrypoint
            result = main()
            return [{"type": "text", "text": str(result)}]
        except Exception as e:
            return [{"type": "text", "text": f"Execution Error: {str(e)}"}]
    raise ValueError(f"Tool not found: {name}")

if __name__ == "__main__":
    asyncio.run(stdio_server(server))
`;

    const dockerfile = `
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt mcp
COPY . .
CMD ["python", "app.py"]
`;

    const reqs = requirements.join('\\n');

    // 2. Fetch dataset blobs to buffer for upload
    const operations: any[] = [
      { operation: 'addOrUpdate', path: 'app.py', content: new Blob([mcpServerCode]) },
      { operation: 'addOrUpdate', path: 'Dockerfile', content: new Blob([dockerfile]) },
      { operation: 'addOrUpdate', path: 'requirements.txt', content: new Blob([reqs]) }
    ];

    for (const dataset of datasets) {
      const res = await fetch(dataset.url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        operations.push({
          operation: 'addOrUpdate',
          path: dataset.filename,
          content: new Blob([buffer])
        });
      }
    }

    // 3. Commit files
    await commit({
      repo: { type: 'space', name: repoId },
      credentials: { accessToken: hfToken },
      title: 'Initial MCP Server Deployment via PublishAI',
      operations
    });

    const spaceUrl = `https://huggingface.co/spaces/${repoId}`;

    return NextResponse.json({
      success: true,
      url: spaceUrl,
      repoId,
      message: "Agent deployment initialized on Hugging Face Spaces."
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get('repoId');
  if (!repoId) return NextResponse.json({ error: 'Missing repoId' }, { status: 400 });

  const hfToken = process.env.HF_TOKEN;
  try {
    const info = await spaceInfo({
      name: repoId,
      credentials: hfToken ? { accessToken: hfToken } : undefined
    });

    return NextResponse.json({
      status: (info as any).runtime?.stage || 'UNKNOWN',
      url: `https://huggingface.co/spaces/${repoId}`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
