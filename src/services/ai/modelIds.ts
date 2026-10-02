/**
 * Single source of truth for LLM model ids. Every call site references a tier
 * here instead of hardcoding an id, so a model retirement is a one-line change
 * (or an env var override) rather than a codebase-wide search.
 *
 * This module has no provider imports and is safe to import anywhere.
 */

export const ANTHROPIC_MODELS = {
  /** Deep reasoning: planning, scientific review, writing, journal matching. */
  reasoning: process.env.ANTHROPIC_REASONING_MODEL || "claude-opus-5-5",
  /** General-purpose default for most agent stages. */
  standard: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  /** Cheap, fast transformations (legends, short rewrites, extraction). */
  fast: process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5",
  /** Code generation and repair in the data sandbox. */
  coding: process.env.ANTHROPIC_CODING_MODEL || "claude-sonnet-5-5",
} as const;

export const OPENAI_MODELS = {
  standard: process.env.OPENAI_MODEL || "gpt-4o",
  mini: process.env.OPENAI_MINI_MODEL || "gpt-4o-mini",
  embedding: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
} as const;

/**
 * Current Claude models reject non-default sampling parameters (temperature /
 * top_p / top_k) with a 400. Haiku 4.5 and older 4.x models still accept them.
 */
export function claudeAcceptsSamplingParams(model: string): boolean {
  return !/claude-(opus-5|sonnet-5|fable|mythos|opus-4-[78])/.test(model);
}
