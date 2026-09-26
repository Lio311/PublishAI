import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export const DEFAULT_OPENAI_MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o';
export const DEFAULT_OPENAI_MINI_MODEL_NAME = process.env.OPENAI_MINI_MODEL || 'gpt-4o-mini';
export const DEFAULT_OPENAI_EMBEDDING_MODEL_NAME = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
export const DEFAULT_ANTHROPIC_MODEL_NAME = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';
export const DEFAULT_ANTHROPIC_FAST_MODEL_NAME = process.env.ANTHROPIC_FAST_MODEL || 'claude-3-5-haiku-20241022';
export const DEFAULT_ANTHROPIC_CODING_MODEL_NAME = process.env.ANTHROPIC_CODING_MODEL || 'claude-3-5-sonnet-20240620';

export const AI_MODELS = {
  // Complex reasoning and vision tasks
  vision: anthropic(DEFAULT_ANTHROPIC_MODEL_NAME),
  
  // Fast text manipulations (improving legends, etc)
  fast: anthropic(DEFAULT_ANTHROPIC_FAST_MODEL_NAME),
  
  // Coding or data analysis
  coding: anthropic(DEFAULT_ANTHROPIC_CODING_MODEL_NAME),

  // OpenAI models
  openai: openai(DEFAULT_OPENAI_MODEL_NAME),
  openaiMini: openai(DEFAULT_OPENAI_MINI_MODEL_NAME),
  embedding: openai.embedding(DEFAULT_OPENAI_EMBEDDING_MODEL_NAME),
} as const;
