import { createLiteratureMcpServer } from '../../src/mcp/literatureMcpServer';
import { createOjsMcpServer } from '../../src/mcp/ojsMcpServer';
import { createWordpressMcpServer } from '../../src/mcp/wordpressMcpServer';
import { isSafeTargetUrl, formatMcpError } from '../../src/mcp/utils';
import { McpSessionRegistry, NextSseTransport } from '../../src/mcp/sseTransport';
import { literatureService } from '../../src/services/literature/literatureService';
import { OJSAdapter } from '../../src/services/submission/adapters/ojs-adapter';
import { WordPressAdapter } from '../../src/services/submission/adapters/wordpress-adapter';
import { db } from '../../src/services/db';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock dependencies
jest.mock('../../src/app/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/services/literature/literatureService', () => ({
  literatureService: {
    search: jest.fn(),
    getByDoi: jest.fn(),
  },
}));

jest.mock('../../src/services/submission/adapters/ojs-adapter');
jest.mock('../../src/services/submission/adapters/wordpress-adapter');
jest.mock('../../src/services/security/encryption', () => ({
  decrypt: jest.fn().mockImplementation((val) => `decrypted_${val}`),
  encrypt: jest.fn().mockImplementation((val) => `encrypted_${val}`),
}));

jest.mock('../../src/services/db', () => ({
  db: {
    query: {
      journalConnections: {
        findFirst: jest.fn(),
      },
    },
  },
}));

describe('MCP Servers Security & Functionality Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security Utilities: SSRF & Secret Redaction', () => {
    it('isSafeTargetUrl correctly validates allowed and disallowed URLs', () => {
      // Allowed public URLs
      expect(isSafeTargetUrl('https://example.com/api').valid).toBe(true);
      expect(isSafeTargetUrl('http://my-academic-journal.org').valid).toBe(true);

      // Disallowed SSRF targets: localhost / loopback
      expect(isSafeTargetUrl('http://localhost:3000').valid).toBe(false);
      expect(isSafeTargetUrl('http://127.0.0.1:8080').valid).toBe(false);
      expect(isSafeTargetUrl('http://0.0.0.0').valid).toBe(false);

      // Disallowed cloud metadata
      expect(isSafeTargetUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);

      // Disallowed private network subnets (RFC 1918)
      expect(isSafeTargetUrl('http://10.0.0.1/admin').valid).toBe(false);
      expect(isSafeTargetUrl('http://172.16.5.10').valid).toBe(false);
      expect(isSafeTargetUrl('http://172.31.255.255').valid).toBe(false);
      expect(isSafeTargetUrl('http://192.168.1.1').valid).toBe(false);

      // Disallowed protocols
      expect(isSafeTargetUrl('file:///etc/passwd').valid).toBe(false);
      expect(isSafeTargetUrl('ftp://ftp.example.com').valid).toBe(false);
      expect(isSafeTargetUrl('javascript:alert(1)').valid).toBe(false);
    });

    it('formatMcpError redacts secrets from error messages', () => {
      const errWithKey = new Error('Failure with key sk-ant-api03-abcdefghijklmnopqrstuvwxyz');
      const result = formatMcpError(errWithKey);

      expect(result.isError).toBe(true);
      const text = (result.content[0] as any).text;
      expect(text).not.toContain('sk-ant-api03-abcdefghijklmnopqrstuvwxyz');
      expect(text).toContain('[REDACTED_ANTHROPIC_KEY]');
    });
  });

  describe('Literature MCP Server', () => {
    it('lists available tools', async () => {
      const server = createLiteratureMcpServer();
      const listHandler = (server as any)._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
      const res = await listHandler({ method: 'tools/list' });

      expect(res.tools).toHaveLength(2);
      expect(res.tools.map((t: any) => t.name)).toEqual(['search_literature', 'get_citation_by_doi']);
    });

    it('search_literature: succeeds with valid parameters', async () => {
      (literatureService.search as jest.Mock).mockResolvedValueOnce({
        query: 'crispr cas9',
        total: 1,
        items: [{ id: 'pmid-1', title: 'CRISPR paper', authors: [{ name: 'Doudna' }] }],
      });

      const server = createLiteratureMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'search_literature',
          arguments: { query: 'crispr cas9', limit: 10 },
        },
      });

      expect(res.isError).toBeFalsy();
      expect(literatureService.search).toHaveBeenCalledWith('crispr cas9', expect.objectContaining({ limit: 10 }));
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.total).toBe(1);
    });

    it('search_literature: returns proper error when query is empty or missing without throwing', async () => {
      const server = createLiteratureMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const resEmpty = await callHandler({
        method: 'tools/call',
        params: {
          name: 'search_literature',
          arguments: { query: '   ' },
        },
      });

      expect(resEmpty.isError).toBe(true);
      expect(resEmpty.content[0].text).toContain('Invalid parameters');

      const resMissing = await callHandler({
        method: 'tools/call',
        params: {
          name: 'search_literature',
          arguments: {},
        },
      });

      expect(resMissing.isError).toBe(true);
      expect(resMissing.content[0].text).toContain("Invalid parameters for 'search_literature'");
    });

    it('get_citation_by_doi: validates and strips DOI prefixes', async () => {
      (literatureService.getByDoi as jest.Mock).mockResolvedValueOnce({
        id: 'crossref-10.1000/182',
        title: 'DOI Handbook',
      });

      const server = createLiteratureMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'get_citation_by_doi',
          arguments: { doi: 'https://doi.org/10.1000/182' },
        },
      });

      expect(res.isError).toBeFalsy();
      expect(literatureService.getByDoi).toHaveBeenCalledWith('10.1000/182');
    });

    it('get_citation_by_doi: returns proper error on invalid DOI format', async () => {
      const server = createLiteratureMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'get_citation_by_doi',
          arguments: { doi: 'not-a-valid-doi' },
        },
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Invalid DOI format');
    });

    it('returns error when tool is not found without throwing', async () => {
      const server = createLiteratureMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'non_existent_tool',
          arguments: {},
        },
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Tool not found');
    });
  });

  describe('OJS MCP Server', () => {
    it('blocks SSRF target in siteUrl', async () => {
      const server = createOjsMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'create_ojs_submission',
          arguments: {
            siteUrl: 'http://169.254.169.254/ojs',
            apiToken: 'fake-token',
            title: 'Test Paper',
            abstract: 'Test Abstract',
            authors: ['Jane Doe'],
          },
        },
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Security validation failed');
    });

    it('executes real OJS submission using direct credentials', async () => {
      const mockSubmit = jest.fn().mockResolvedValueOnce({
        success: true,
        postId: '42',
        confirmationId: 'OJS-42',
        rawResponse: { id: 42 },
      });
      (OJSAdapter as jest.Mock).mockImplementation(() => ({
        submit: mockSubmit,
      }));

      const server = createOjsMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'create_ojs_submission',
          arguments: {
            siteUrl: 'https://journal.example.org',
            apiToken: 'valid-ojs-token',
            title: 'Valid Paper',
            abstract: 'Valid Abstract',
            authors: [{ name: 'Jane Doe', email: 'jane@example.org' }],
          },
        },
      });

      expect(res.isError).toBeFalsy();
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Valid Paper',
        abstract: 'Valid Abstract',
      }));
      const text = res.content[0].text;
      expect(text).toContain('OJS submission created successfully');
      expect(text).toContain('OJS-42');
    });

    it('enforces access control on saved connectionId (rejects unauthorized client)', async () => {
      (db.query.journalConnections.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const server = createOjsMcpServer({ userId: 'user-123', requireAuth: true });
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'create_ojs_submission',
          arguments: {
            connectionId: 999,
            title: 'Test Paper',
            abstract: 'Test Abstract',
            authors: ['Author 1'],
          },
        },
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('not found or you do not have permission');
    });

    it('authorizes and resolves saved connectionId for the connection owner', async () => {
      (db.query.journalConnections.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 10,
        userId: 'user-123',
        platform: 'ojs',
        siteUrl: 'https://my-ojs.org',
        encryptedUsername: 'my-encrypted-token',
      });

      const mockSubmit = jest.fn().mockResolvedValueOnce({
        success: true,
        postId: '101',
        confirmationId: 'OJS-101',
      });
      (OJSAdapter as jest.Mock).mockImplementation(() => ({
        submit: mockSubmit,
      }));

      const server = createOjsMcpServer({ userId: 'user-123', requireAuth: true });
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'create_ojs_submission',
          arguments: {
            connectionId: 10,
            title: 'Owner Paper',
            abstract: 'Owner Abstract',
            authors: ['Owner Name'],
          },
        },
      });

      expect(res.isError).toBeFalsy();
      expect(OJSAdapter).toHaveBeenCalledWith('https://my-ojs.org', 'decrypted_my-encrypted-token');
    });
  });

  describe('WordPress MCP Server', () => {
    it('blocks SSRF target in siteUrl', async () => {
      const server = createWordpressMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'create_wp_draft',
          arguments: {
            siteUrl: 'http://127.0.0.1:8000',
            username: 'admin',
            appPassword: 'pwd',
            title: 'Test Post',
            content: '<p>Content</p>',
          },
        },
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Security validation failed');
    });

    it('executes real WordPress draft creation using direct credentials', async () => {
      const mockSubmit = jest.fn().mockResolvedValueOnce({
        success: true,
        postId: '77',
        postUrl: 'https://wp.example.com/post/77',
        confirmationId: 'WP-77',
      });
      (WordPressAdapter as jest.Mock).mockImplementation(() => ({
        submit: mockSubmit,
      }));

      const server = createWordpressMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'create_wp_draft',
          arguments: {
            siteUrl: 'https://wp.example.com',
            username: 'editor',
            appPassword: 'app-pwd-123',
            title: 'WP Article',
            content: '<h2>Scientific Review</h2>',
            status: 'draft',
          },
        },
      });

      expect(res.isError).toBeFalsy();
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: 'WP Article',
        content: '<h2>Scientific Review</h2>',
        publishMode: 'draft',
      }));
      expect(res.content[0].text).toContain('WordPress draft created successfully');
      expect(res.content[0].text).toContain('WP-77');
    });

    it('handles test_wp_connection tool execution and error reporting', async () => {
      const mockTestConnection = jest.fn().mockResolvedValueOnce({
        success: false,
        message: 'Invalid credentials or 401',
      });
      (WordPressAdapter as jest.Mock).mockImplementation(() => ({
        testConnection: mockTestConnection,
      }));

      const server = createWordpressMcpServer();
      const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      const res = await callHandler({
        method: 'tools/call',
        params: {
          name: 'test_wp_connection',
          arguments: {
            siteUrl: 'https://wp.example.com',
            username: 'bad_user',
            appPassword: 'bad_password',
          },
        },
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('WordPress Connection Test Failed');
    });
  });

  describe('Session Registry & Memory Leak Protection', () => {
    it('manages sessions and evicts oldest when exceeding max capacity', () => {
      const registry = new McpSessionRegistry(60000, 2);

      const mockController = {
        close: jest.fn(),
        enqueue: jest.fn(),
      } as any;

      const t1 = new NextSseTransport('session-1', mockController, 'user-1');
      const t2 = new NextSseTransport('session-2', mockController, 'user-2');
      const t3 = new NextSseTransport('session-3', mockController, 'user-3');

      registry.register(t1);
      registry.register(t2);
      expect(registry.size).toBe(2);
      expect(registry.get('session-1')).toBeDefined();

      // Registering third session should evict oldest (session-1)
      registry.register(t3);
      expect(registry.size).toBe(2);
      expect(registry.get('session-1')).toBeUndefined();
      expect(registry.get('session-2')).toBeDefined();
      expect(registry.get('session-3')).toBeDefined();
    });

    it('prunes expired idle sessions based on TTL', () => {
      const registry = new McpSessionRegistry(10, 50); // 10ms TTL

      const mockController = {
        close: jest.fn(),
        enqueue: jest.fn(),
      } as any;

      const t = new NextSseTransport('session-timeout', mockController, 'user-1');
      t.lastActiveAt = Date.now() - 50; // Already past 10ms TTL

      registry.register(t);
      // Attempting to retrieve expired session should return undefined and prune it
      expect(registry.get('session-timeout')).toBeUndefined();
      expect(registry.size).toBe(0);
    });
  });

  describe('Route Handlers & Endpoint Access Control', () => {
    it('rejects unauthenticated GET and POST requests with 401', async () => {
      const { createMcpRouteHandler } = await import('../../src/mcp/routeHandler');
      const { GET, POST } = createMcpRouteHandler(createLiteratureMcpServer, 'literature');

      // Unauthenticated GET
      const getReq = new Request('http://localhost:3000/api/mcp/literature', {
        method: 'GET',
      }) as any;
      const getRes = await GET(getReq);
      expect(getRes.status).toBe(401);
      const getBody = await getRes.json();
      expect(getBody.error).toContain('Unauthorized');

      // Unauthenticated POST
      const postReq = new Request('http://localhost:3000/api/mcp/literature?sessionId=test-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      }) as any;
      const postRes = await POST(postReq);
      expect(postRes.status).toBe(401);
    });

    it('rejects POST with missing sessionId or nonexistent session when authenticated', async () => {
      const prevKey = process.env.MCP_API_KEY;
      process.env.MCP_API_KEY = 'secret-test-key-12345';

      try {
        const { createMcpRouteHandler } = await import('../../src/mcp/routeHandler');
        const { POST } = createMcpRouteHandler(createLiteratureMcpServer, 'literature');

        // Authenticated POST missing sessionId
        const reqNoSession = new Request('http://localhost:3000/api/mcp/literature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'secret-test-key-12345',
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
        }) as any;
        const resNoSession = await POST(reqNoSession);
        expect(resNoSession.status).toBe(400);

        // Authenticated POST with non-existent session
        const reqNonExistent = new Request('http://localhost:3000/api/mcp/literature?sessionId=non-existent-uuid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'secret-test-key-12345',
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
        }) as any;
        const resNonExistent = await POST(reqNonExistent);
        expect(resNonExistent.status).toBe(404);
      } finally {
        process.env.MCP_API_KEY = prevKey;
      }
    });
  });
});
