import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export const AI_MODELS = {
  // Use for complex reasoning and vision tasks
  vision: anthropic('claude-3-7-sonnet-20250219'),
  
  // Use for fast text manipulations (improving legends, etc)
  fast: anthropic('claude-3-5-haiku-20241022'),
  
  // Use for coding or data analysis
  coding: anthropic('claude-3-5-sonnet-20240620'),
} as const;
