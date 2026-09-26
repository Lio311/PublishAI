import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { AIProvider } from './types';

export const DEFAULT_OPENAI_MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o';
export const DEFAULT_OPENAI_MINI_MODEL_NAME = process.env.OPENAI_MINI_MODEL || 'gpt-4o-mini';
export const DEFAULT_OPENAI_EMBEDDING_MODEL_NAME = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
export const DEFAULT_ANTHROPIC_MODEL_NAME = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';
export const DEFAULT_ANTHROPIC_FAST_MODEL_NAME = process.env.ANTHROPIC_FAST_MODEL || 'claude-3-5-haiku-20241022';
export const DEFAULT_ANTHROPIC_CODING_MODEL_NAME = process.env.ANTHROPIC_CODING_MODEL || 'claude-3-5-sonnet-20240620';

export const FALLBACK_OPENAI_EMBEDDING_MODELS = [
  DEFAULT_OPENAI_EMBEDDING_MODEL_NAME,
  'text-embedding-3-large',
  'text-embedding-ada-002',
];

export interface ModelCandidate {
  model: string;
  provider: AIProvider;
}

/**
 * Predefined fallback cascades for common primary models.
 * If the primary model encounters rate limits (429), quotas, or transient downtime,
 * the executor cascades down this hierarchy.
 */
export const MODEL_FALLBACK_CHAINS: Record<string, ModelCandidate[]> = {
  // OpenAI
  'gpt-4o': [
    { model: 'gpt-4o', provider: 'openai' },
    { model: 'gpt-4o-mini', provider: 'openai' },
    { model: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
  ],
  'gpt-4o-mini': [
    { model: 'gpt-4o-mini', provider: 'openai' },
    { model: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
  ],
  'o1': [
    { model: 'o1', provider: 'openai' },
    { model: 'gpt-4o', provider: 'openai' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
  'o3-mini': [
    { model: 'o3-mini', provider: 'openai' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
  // Anthropic
  'claude-3-7-sonnet-20250219': [
    { model: 'claude-3-7-sonnet-20250219', provider: 'anthropic' },
    { model: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
  'claude-3-5-sonnet-20240620': [
    { model: 'claude-3-5-sonnet-20240620', provider: 'anthropic' },
    { model: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
  'claude-3-5-sonnet-20241022': [
    { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
    { model: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
  'claude-3-5-haiku-20241022': [
    { model: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
};

/**
 * Returns a fallback chain for any model or provider.
 */
export function getModelFallbackChain(
  model: string = DEFAULT_OPENAI_MODEL_NAME,
  provider?: AIProvider
): ModelCandidate[] {
  if (MODEL_FALLBACK_CHAINS[model]) {
    return MODEL_FALLBACK_CHAINS[model];
  }

  const resolvedProvider: AIProvider =
    provider || (model.startsWith('claude') || model.includes('anthropic') ? 'anthropic' : 'openai');

  if (resolvedProvider === 'anthropic') {
    return [
      { model, provider: 'anthropic' },
      { model: DEFAULT_ANTHROPIC_FAST_MODEL_NAME, provider: 'anthropic' },
      { model: DEFAULT_OPENAI_MINI_MODEL_NAME, provider: 'openai' },
    ];
  }

  return [
    { model, provider: 'openai' },
    { model: DEFAULT_OPENAI_MINI_MODEL_NAME, provider: 'openai' },
    { model: DEFAULT_ANTHROPIC_FAST_MODEL_NAME, provider: 'anthropic' },
  ];
}

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
