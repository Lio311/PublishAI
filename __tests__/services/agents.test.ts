jest.mock("@e2b/code-interpreter", () => ({ Sandbox: { create: jest.fn() } }));
jest.mock("@/services/e2bService", () => ({ runPythonInSandbox: jest.fn() }));

import { PublishAIStateAnnotation, getPreviousStageOutput, PublishAIState } from "@/services/agents/graph/state";
import { routeFromStart, routeAfterIntegrity } from "@/services/agents/graph/workflow";
import { editsNode } from "@/services/agents/graph/nodes/editsNode";
import { END } from "@langchain/langgraph";
import { AgentResult } from "@/services/agents/base-agent";

describe("PublishAI Agents & Workflow Suite", () => {
  describe("PublishAIStateAnnotation & Reducers", () => {
    it("handles undefined and plain object in previousStageOutputs reducer without throwing", () => {
      const channel = (PublishAIStateAnnotation.spec as any).previousStageOutputs;
      const reducer = channel.value ?? channel.operator ?? channel.reducer ?? channel.spec?.value;
      if (typeof reducer === "function") {
        const map1 = new Map([["clarification" as const, { stage: "clarification", status: "completed", output: "test", tokensUsed: 10, model: "m" } as AgentResult]]);
        const merged1 = reducer(map1, undefined);
        expect(merged1 instanceof Map).toBe(true);
        expect(merged1.get("clarification")?.output).toBe("test");

        // Test starting from plain object (e.g. deserialized from checkpoint)
        const plainObj = {
          clarification: { stage: "clarification", status: "completed", output: "from_json", tokensUsed: 5, model: "m" }
        };
        const merged2 = reducer(plainObj, undefined);
        expect(merged2 instanceof Map).toBe(true);
        expect(merged2.get("clarification")?.output).toBe("from_json");

        // Test updating with a plain object update
        const updateObj = {
          planning: { stage: "planning", status: "awaiting_approval", output: "plan_out", tokensUsed: 15, model: "m" }
        };
        const merged3 = reducer(merged2, updateObj);
        expect(merged3 instanceof Map).toBe(true);
        expect(merged3.get("clarification")?.output).toBe("from_json");
        expect(merged3.get("planning")?.output).toBe("plan_out");
      }
    });

    it("getPreviousStageOutput works with both Map and plain object", () => {
      const stateWithMap = {
        previousStageOutputs: new Map([["scientific_review" as const, { stage: "scientific_review", status: "completed", output: "map_review", tokensUsed: 1, model: "m" } as AgentResult]])
      } as unknown as PublishAIState;
      expect(getPreviousStageOutput(stateWithMap, "scientific_review")?.output).toBe("map_review");

      const stateWithObj = {
        previousStageOutputs: {
          scientific_review: { stage: "scientific_review", status: "completed", output: "obj_review", tokensUsed: 1, model: "m" }
        }
      } as unknown as PublishAIState;
      expect(getPreviousStageOutput(stateWithObj, "scientific_review")?.output).toBe("obj_review");

      const stateEmpty = {} as unknown as PublishAIState;
      expect(getPreviousStageOutput(stateEmpty, "scientific_review")).toBeUndefined();
    });

    it("journalRules is retained in state annotation", () => {
      const spec = (PublishAIStateAnnotation.spec as any).journalRules;
      expect(spec).toBeDefined();
      const reducer = spec.value ?? spec.operator ?? spec.reducer;
      if (typeof reducer === "function") {
        const reduced = reducer({}, { name: "Nature", coverLetterRules: { toneGuidance: "formal" } });
        expect(reduced.name).toBe("Nature");
      }
    });
  });

  describe("Graph Routing Logic", () => {
    it("routeFromStart routes standard submission with targetJournalId to clarificationNode, NOT cascadeNode", () => {
      const standardState = {
        action: "start",
        targetJournalId: "nature-medicine",
        paperId: "123",
      } as unknown as PublishAIState;
      expect(routeFromStart(standardState)).toBe("clarificationNode");
    });

    it("routeFromStart routes action: 'cascade' to cascadeNode", () => {
      const cascadeState = {
        action: "cascade",
        targetJournalId: "plos-one",
        previousJournalId: "nature",
      } as unknown as PublishAIState;
      expect(routeFromStart(cascadeState)).toBe("cascadeNode");
    });

    it("routeFromStart routes rebuttal action or reviewer comments to rebuttalNode", () => {
      const rebuttalState = {
        action: "start_rebuttal",
        reviewerComments: "Please address reviewer 1 comments.",
      } as unknown as PublishAIState;
      expect(routeFromStart(rebuttalState)).toBe("rebuttalNode");

      const commentsOnlyState = {
        action: "",
        reviewerComments: "Fix figures.",
      } as unknown as PublishAIState;
      expect(routeFromStart(commentsOnlyState)).toBe("rebuttalNode");
    });

    it("routeAfterIntegrity stops at END when integrity fails (passed: false)", () => {
      const failedState = {
        integrityResult: {
          passed: false,
          status: "fail",
          plagiarismScore: 35,
          aiScore: 50,
        },
      } as unknown as PublishAIState;
      expect(routeAfterIntegrity(failedState)).toBe(END);
    });

    it("routeAfterIntegrity proceeds to qaNode when integrity passes", () => {
      const passedState = {
        integrityResult: {
          passed: true,
          status: "pass",
          plagiarismScore: 5,
          aiScore: 10,
        },
      } as unknown as PublishAIState;
      expect(routeAfterIntegrity(passedState)).toBe("qaNode");
    });
  });

  describe("editsNode Behavior", () => {
    it("preserves cascade edits if already present", async () => {
      const existingEdits = [{ section: "Abstract", instruction: "Shorten to 150 words." }];
      const result = await editsNode({ edits: existingEdits } as unknown as PublishAIState);
      expect(result.edits).toEqual(existingEdits);
    });

    it("formats guardrails validation errors into structured edits", async () => {
      const stateWithErrors = {
        validationErrors: ["ERROR: Tone is overly promotional.", "ERROR: Missing ethical statement."],
      } as unknown as PublishAIState;
      const result = await editsNode(stateWithErrors);
      expect(Array.isArray(result.edits)).toBe(true);
      expect((result.edits as any[])[0].section).toBe("Guardrails Finding #1");
      expect((result.edits as any[])[0].instruction).toBe("ERROR: Tone is overly promotional.");
    });
  });
});
