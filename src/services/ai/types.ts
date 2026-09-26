export type AIProvider = 'openai' | 'anthropic';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'o1'
  | 'o3-mini'
  | (string & {});

export type AnthropicModel =
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-5-haiku-20241022'
  | (string & {});

export type AIModel = OpenAIModel | AnthropicModel;

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  userId?: string;
  useMemory?: boolean;
  retries?: number;
}

export interface ChatOptions {
  messages: AIMessage[];
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  retries?: number;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  usage?: TokenUsage;
}

export interface StreamTextCallbacks {
  onToken?: (token: string) => void;
}

export interface DraftSectionOptions {
  sectionTitle: string;
  paperTopic: string;
  outline?: string;
  context?: string;
  targetJournal?: string;
  guidelines?: string;
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  retries?: number;
}

export interface RefineWritingOptions {
  text: string;
  mode: 'academic_tone' | 'clarity' | 'conciseness' | 'formalize' | 'expand' | 'fix_grammar';
  feedback?: string;
  guidelines?: string;
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  userId?: string;
  journalId?: number;
  retries?: number;
}

export interface GenerateAbstractOptions {
  title: string;
  introduction?: string;
  methods?: string;
  results?: string;
  conclusion?: string;
  wordLimit?: number;
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  retries?: number;
}

export interface LiteraturePaper {
  title: string;
  authors?: string;
  year?: string | number;
  abstract?: string;
  keyFindings?: string;
}

export interface SynthesizeLiteratureOptions {
  topic: string;
  researchQuestion?: string;
  papers: LiteraturePaper[];
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  retries?: number;
}

export interface PeerReviewCritiqueOptions {
  sectionName: string;
  text: string;
  criteria?: string[];
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  retries?: number;
}

export interface ReviewResponseOptions {
  reviewerComment: string;
  manuscriptContext?: string;
  changesMade?: string;
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  retries?: number;
}
