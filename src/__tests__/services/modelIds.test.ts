/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import { ANTHROPIC_MODELS, claudeAcceptsSamplingParams } from "@/services/ai/modelIds";

const SRC = path.join(process.cwd(), "src");
const RETIRED_MODEL = /claude-(3|2)[-.][a-z0-9-]*|claude-instant/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("model ids", () => {
  it("never references retired Claude models in application code", () => {
    const offenders = sourceFiles(SRC).filter((file) => RETIRED_MODEL.test(fs.readFileSync(file, "utf8")));
    expect(offenders.map((f) => path.relative(process.cwd(), f))).toEqual([]);
  });

  it("defaults to current Claude models", () => {
    expect(ANTHROPIC_MODELS.reasoning).toBe("claude-opus-5-5");
    expect(ANTHROPIC_MODELS.standard).toBe("claude-sonnet-5-5");
    expect(ANTHROPIC_MODELS.fast).toBe("claude-haiku-4-5");
  });

  it("knows which models reject sampling parameters", () => {
    expect(claudeAcceptsSamplingParams("claude-opus-5-5")).toBe(false);
    expect(claudeAcceptsSamplingParams("claude-sonnet-5-5")).toBe(false);
    expect(claudeAcceptsSamplingParams("claude-haiku-4-5")).toBe(true);
  });
});
