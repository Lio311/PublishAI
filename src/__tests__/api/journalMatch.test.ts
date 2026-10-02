/**
 * @jest-environment node
 */
import { POST } from "@/app/api/journal-match/route";

const mockSession: { user: { id: string } | null } = { user: { id: "user_1" } };

jest.mock("@/app/auth", () => ({
  auth: jest.fn(() => Promise.resolve(mockSession)),
}));

jest.mock("@/services/rate-limit", () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/services/journal-matcher/pipeline", () => {
  const actual = jest.requireActual("@/services/journal-matcher/pipeline");
  return { ...actual, matchJournals: jest.fn() };
});

import { matchJournals } from "@/services/journal-matcher/pipeline";
import { AgentError } from "@/services/journal-matcher/agents";

const mockedMatch = matchJournals as jest.MockedFunction<typeof matchJournals>;
const manuscript = "Background. ".repeat(100);

function request(fields: Record<string, string | File>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return new Request("http://localhost/api/journal-match", { method: "POST", body });
}

async function readEvents(res: Response) {
  const text = await res.text();
  return text.trim().split("\n").map((line) => JSON.parse(line));
}

describe("POST /api/journal-match", () => {
  beforeEach(() => {
    mockSession.user = { id: "user_1" };
    mockedMatch.mockReset();
  });

  it("requires authentication", async () => {
    mockSession.user = null;
    const res = await POST(request({ text: manuscript }));
    expect(res.status).toBe(401);
    expect(mockedMatch).not.toHaveBeenCalled();
  });

  it("rejects requests with no manuscript", async () => {
    const res = await POST(request({ priority: "balanced" }));
    expect(res.status).toBe(400);
  });

  it("rejects text too short to analyze with 422", async () => {
    const res = await POST(request({ text: "too short" }));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("EMPTY_TEXT");
  });

  it("rejects unsupported file types", async () => {
    const res = await POST(request({ file: new File(["x"], "slides.pptx") }));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("UNSUPPORTED_TYPE");
  });

  it("streams progress and the final result, passing preferences through", async () => {
    mockedMatch.mockImplementation(async (_text, _prefs, _locale, onProgress) => {
      onProgress?.({ type: "stage", stage: "profiling" });
      return { recommendations: [], overview: "ok" } as never;
    });

    const res = await POST(
      request({ file: new File([manuscript], "paper.txt"), priority: "impact", openAccessOnly: "true", maxApcUsd: "3000", locale: "en" })
    );
    const events = await readEvents(res);

    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    expect(events.map((e) => e.type)).toEqual(["stage", "result"]);
    expect(mockedMatch).toHaveBeenCalledWith(
      expect.stringContaining("Background."),
      { priority: "impact", openAccessOnly: true, maxApcUsd: 3000 },
      "en",
      expect.any(Function)
    );
  });

  it("streams a typed error when the AI service is not configured", async () => {
    mockedMatch.mockRejectedValue(new AgentError("missing key", "AI_NOT_CONFIGURED"));
    const events = await readEvents(await POST(request({ text: manuscript })));
    expect(events).toEqual([{ type: "error", error: "missing key", code: "AI_NOT_CONFIGURED" }]);
  });

  it("hides internal error details", async () => {
    mockedMatch.mockRejectedValue(new Error("db password leaked in stack"));
    const events = await readEvents(await POST(request({ text: manuscript })));
    expect(events).toEqual([{ type: "error", error: "Journal matching failed", code: "INTERNAL" }]);
  });
});
