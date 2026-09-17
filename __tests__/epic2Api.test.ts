import { NextRequest } from "next/server";
import { GET as getLiteratureSearch } from "@/app/api/literature/search/route";
import { POST as generateAi } from "@/app/api/ai/generate/route";

jest.mock("@/services/literature/literatureService", () => ({
  literatureService: {
    search: jest.fn().mockResolvedValue({
      query: "quantum",
      total: 1,
      items: [{ id: "mock-1", title: "Quantum Test" }],
      sources: { pubmed: 1, crossref: 0 }
    })
  }
}));

jest.mock("@/services/ai/aiService", () => ({
  callLLM: jest.fn().mockResolvedValue({
    text: "This is a mock AI response.",
    provider: "openai",
    model: "gpt-4o",
    tokensUsed: 10,
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 }
  })
}));

describe("Epic 2 API Routes", () => {
  describe("Literature Search API", () => {
    it("GET /api/literature/search returns search results", async () => {
      const req = new NextRequest("http://localhost/api/literature/search?q=quantum&limit=5");
      const res = await getLiteratureSearch(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.query).toBe("quantum");
      expect(json.items[0].title).toBe("Quantum Test");
    });

    it("GET /api/literature/search returns 400 when missing query parameter", async () => {
      const req = new NextRequest("http://localhost/api/literature/search");
      const res = await getLiteratureSearch(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("required");
    });
  });

  describe("AI Generation API", () => {
    it("POST /api/ai/generate returns generated text", async () => {
      const req = new Request("http://localhost/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Write an abstract for a paper about quantum gravity.",
          model: "gpt-4o"
        }),
      });
      const res = await generateAi(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.text).toBe("This is a mock AI response.");
    });

    it("POST /api/ai/generate returns 400 when prompt is missing", async () => {
      const req = new Request("http://localhost/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ model: "gpt-4o" }),
      });
      const res = await generateAi(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("required");
    });
  });
});
