/**
 * @jest-environment node
 *
 * Regression tests for API routes that previously had no authentication or
 * ownership checks.
 */
import { NextRequest } from "next/server";

const mockSession: { user: { id: string; email?: string } | null } = { user: null };
jest.mock("@/app/auth", () => ({ auth: jest.fn(() => Promise.resolve(mockSession)) }));
jest.mock("@/services/rate-limit", () => ({ applyRateLimit: jest.fn().mockResolvedValue(null) }));
jest.mock("@/inngest/client", () => ({ inngest: { send: jest.fn() } }));
jest.mock("@/services/agents/fix-code-agent", () => ({ fixCodeAgent: { patchBrokenCode: jest.fn() } }));
jest.mock("@/services/visionAi.service", () => ({ analyzeFigureWithVisionAi: jest.fn() }));
jest.mock("@/services/graph/logicChecker", () => ({ checkLogicalConsistency: jest.fn() }));

// Every ownership lookup finds nothing: the resource belongs to someone else.
const emptyQuery = () => {
  const chain: Record<string, unknown> = {};
  for (const method of ["from", "innerJoin", "leftJoin", "where", "orderBy", "limit"]) {
    chain[method] = jest.fn(() => chain);
  }
  chain.then = (resolve: (rows: unknown[]) => void) => resolve([]);
  return chain;
};
jest.mock("@/services/db", () => ({
  db: {
    select: jest.fn(() => emptyQuery()),
    update: jest.fn(),
    insert: jest.fn(),
  },
}));

import { POST as autoFix } from "@/app/api/sandbox/auto-fix/route";
import { PUT as updateLegend } from "@/app/api/figures/[figureId]/legend/route";
import { POST as analyzeFigure } from "@/app/api/figures/[figureId]/analyze/route";
import { POST as logicCheck } from "@/app/api/graph/logic-check/route";
import { GET as graphNetwork } from "@/app/api/graph/network/route";
import { GET as graphAnalytics } from "@/app/api/graph/analytics/route";
import { GET as graphVisualize } from "@/app/api/graph/visualize/[paperId]/route";
import { GET as debateByPaper } from "@/app/api/debates/[debateId]/route";
import { GET as rlhfEvaluations } from "@/app/api/rlhf/evaluations/route";
import { GET as paperRpaJob } from "@/app/api/papers/[id]/rpa-job/route";
import { GET as paperFile } from "@/app/api/papers/[id]/file/route";
import { POST as rpaResume } from "@/app/api/rpa/resume/[jobId]/route";

const json = (url: string, body: unknown, method = "POST") =>
  new NextRequest(url, { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const params = <T,>(value: T) => ({ params: Promise.resolve(value) });

describe("API route authorization", () => {
  beforeEach(() => {
    mockSession.user = null;
  });

  it("rejects anonymous callers with 401", async () => {
    const responses = await Promise.all([
      autoFix(json("http://x/api/sandbox/auto-fix", { code: "x", stderr: "y" })),
      updateLegend(json("http://x", { legend: "new" }, "PUT"), params({ figureId: "f1" })),
      analyzeFigure(json("http://x", { claims: [] }), params({ figureId: "f1" })),
      logicCheck(json("http://x", { claims: [] })),
      graphNetwork(),
      graphAnalytics(),
      graphVisualize(new Request("http://x"), params({ paperId: "1" })),
      debateByPaper(new NextRequest("http://x"), params({ debateId: "1" })),
      rlhfEvaluations(),
      paperRpaJob(new Request("http://x"), params({ id: "1" })),
      paperFile(new Request("http://x"), params({ id: "1" })),
      rpaResume(json("http://x", { input: "abc" }), params({ jobId: "00000000-0000-0000-0000-000000000000" })),
    ]);
    expect(responses.map((r) => r.status)).toEqual(Array(responses.length).fill(401));
  });

  it("hides other users' resources behind 404", async () => {
    mockSession.user = { id: "user_a", email: "a@example.com" };
    const responses = await Promise.all([
      updateLegend(json("http://x", { legend: "new" }, "PUT"), params({ figureId: "f1" })),
      analyzeFigure(json("http://x", { claims: [] }), params({ figureId: "f1" })),
      graphVisualize(new Request("http://x"), params({ paperId: "7" })),
      debateByPaper(new NextRequest("http://x"), params({ debateId: "7" })),
      paperRpaJob(new Request("http://x"), params({ id: "7" })),
      paperFile(new Request("http://x"), params({ id: "7" })),
    ]);
    expect(responses.map((r) => r.status)).toEqual(Array(responses.length).fill(404));
  });

  it("restricts RLHF endpoints to admins", async () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    mockSession.user = { id: "user_a", email: "a@example.com" };
    expect((await rlhfEvaluations()).status).toBe(403);
  });

});
