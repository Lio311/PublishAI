import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { AIProvider } from './types';
import { ANTHROPIC_MODELS, OPENAI_MODELS } from './modelIds';

export const DEFAULT_OPENAI_MODEL_NAME = OPENAI_MODELS.standard;
export const DEFAULT_OPENAI_MINI_MODEL_NAME = OPENAI_MODELS.mini;
export const DEFAULT_OPENAI_EMBEDDING_MODEL_NAME = OPENAI_MODELS.embedding;
export const DEFAULT_ANTHROPIC_MODEL_NAME = ANTHROPIC_MODELS.standard;
export const DEFAULT_ANTHROPIC_FAST_MODEL_NAME = ANTHROPIC_MODELS.fast;
export const DEFAULT_ANTHROPIC_CODING_MODEL_NAME = ANTHROPIC_MODELS.coding;

export const FALLBACK_OPENAI_EMBEDDING_MODELS = [
  DEFAULT_OPENAI_EMBEDDING_MODEL_NAME,
  'text-embedding-3-large',
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
  [OPENAI_MODELS.standard]: [
    { model: OPENAI_MODELS.standard, provider: 'openai' },
    { model: OPENAI_MODELS.mini, provider: 'openai' },
    { model: ANTHROPIC_MODELS.fast, provider: 'anthropic' },
  ],
  [OPENAI_MODELS.mini]: [
    { model: OPENAI_MODELS.mini, provider: 'openai' },
    { model: ANTHROPIC_MODELS.fast, provider: 'anthropic' },
  ],
  // Anthropic
  [ANTHROPIC_MODELS.reasoning]: [
    { model: ANTHROPIC_MODELS.reasoning, provider: 'anthropic' },
    { model: ANTHROPIC_MODELS.standard, provider: 'anthropic' },
    { model: OPENAI_MODELS.standard, provider: 'openai' },
  ],
  [ANTHROPIC_MODELS.standard]: [
    { model: ANTHROPIC_MODELS.standard, provider: 'anthropic' },
    { model: ANTHROPIC_MODELS.fast, provider: 'anthropic' },
    { model: OPENAI_MODELS.mini, provider: 'openai' },
  ],
  [ANTHROPIC_MODELS.fast]: [
    { model: ANTHROPIC_MODELS.fast, provider: 'anthropic' },
    { model: OPENAI_MODELS.mini, provider: 'openai' },
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
