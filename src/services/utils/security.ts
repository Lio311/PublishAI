/**
 * PublishAI Security & Privacy Utilities
 * 
 * Provides utilities for:
 * 1. Personally Identifiable Information (PII) detection & stripping/redaction
 * 2. Input validation, XSS sanitization, and SQL/Prompt Injection screening
 * 3. HTTP Security headers and API request validation middleware helpers
 */

// ==========================================
// 1. PII Types, Patterns & Stripping Logic
// ==========================================

export type PIIType = 
  | 'email'
  | 'phone'
  | 'ssn'
  | 'creditCard'
  | 'ipv4'
  | 'ipv6'
  | 'apiKey'
  | 'custom';

export interface PIIPatternDefinition {
  type: PIIType;
  regex: RegExp;
  placeholder: string;
  description: string;
}

export interface PIIStripOptions {
  types?: PIIType[];
  customPlaceholders?: Partial<Record<PIIType, string>>;
  customPatterns?: { type: string; regex: RegExp; placeholder: string }[];
  maskInsteadOfRedact?: boolean;
}

export interface PIIDetectionMatch {
  type: PIIType;
  value: string;
  index: number;
  length: number;
  placeholder: string;
}

/**
 * Standard regular expressions for identifying PII
 */
export const PII_PATTERNS: Record<Exclude<PIIType, 'custom'>, PIIPatternDefinition> = {
  email: {
    type: 'email',
    regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi,
    placeholder: '[EMAIL_REDACTED]',
    description: 'Email address'
  },
  phone: {
    type: 'phone',
    // Matches common US and international formats
    regex: /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|\b\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,4}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}\b/g,
    placeholder: '[PHONE_REDACTED]',
    description: 'Phone number'
  },
  ssn: {
    type: 'ssn',
    // Matches US SSN format: 000-00-0000 or 000 00 0000
    regex: /\b\d{3}[- ]\d{2}[- ]\d{4}\b/g,
    placeholder: '[SSN_REDACTED]',
    description: 'Social Security Number'
  },
  creditCard: {
    type: 'creditCard',
    // Matches common 13-19 digit credit card numbers (Visa, MasterCard, Amex, Discover)
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    placeholder: '[CREDIT_CARD_REDACTED]',
    description: 'Credit Card Number'
  },
  ipv4: {
    type: 'ipv4',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    placeholder: '[IP_REDACTED]',
    description: 'IPv4 Address'
  },
  ipv6: {
    type: 'ipv6',
    regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:|:(?::[0-9a-fA-F]{1,4}){1,7}\b/g,
    placeholder: '[IPV6_REDACTED]',
    description: 'IPv6 Address'
  },
  apiKey: {
    type: 'apiKey',
    regex: /\b(?:sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|Bearer\s+[a-zA-Z0-9._-]{20,})\b/gi,
    placeholder: '[API_KEY_REDACTED]',
    description: 'API Key or Secret Token'
  }
};

/**
 * Detects all occurrences of PII within a given string
 */
export function detectPII(text: string, options: PIIStripOptions = {}): PIIDetectionMatch[] {
  if (!text || typeof text !== 'string') return [];

  const typesToScan = options.types || (Object.keys(PII_PATTERNS) as (Exclude<PIIType, 'custom'>)[]);
  const matches: PIIDetectionMatch[] = [];

  for (const type of typesToScan) {
    const patternDef = PII_PATTERNS[type as Exclude<PIIType, 'custom'>];
    if (!patternDef) continue;

    const regex = new RegExp(patternDef.regex.source, patternDef.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (type === 'phone') {
        const cleaned = match[0].replace(/\D/g, '');
        if (cleaned.length < 7 || cleaned.length > 15) continue;
      }

      const placeholder = options.customPlaceholders?.[type] || patternDef.placeholder;
      matches.push({
        type,
        value: match[0],
        index: match.index,
        length: match[0].length,
        placeholder
      });
    }
  }

  if (options.customPatterns) {
    for (const custom of options.customPatterns) {
      const regex = new RegExp(custom.regex.source, custom.regex.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: 'custom',
          value: match[0],
          index: match.index,
          length: match[0].length,
          placeholder: custom.placeholder
        });
      }
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

/**
 * Checks if the text contains any detectable PII
 */
export function containsPII(text: string, options: PIIStripOptions = {}): boolean {
  return detectPII(text, options).length > 0;
}

/**
 * Masks a sensitive string partially (e.g. j***@example.com, or ***-**-1234)
 */
export function maskSensitiveValue(value: string, type: PIIType): string {
  if (!value) return '';
  if (type === 'email') {
    const parts = value.split('@');
    if (parts.length === 2 && parts[0].length > 1) {
      return `${parts[0][0]}***@${parts[1]}`;
    }
    return '***@***.***';
  }
  if (type === 'phone') {
    return value.length > 4 ? `***-***-${value.slice(-4)}` : '***';
  }
  if (type === 'ssn' || type === 'creditCard') {
    return value.length > 4 ? `***-${value.slice(-4)}` : '****';
  }
  if (type === 'apiKey') {
    return value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '********';
  }
  return '***';
}

/**
 * Strips or redacts Personally Identifiable Information (PII) from a string
 */
export function stripPII(text: string, options: PIIStripOptions = {}): string {
  if (!text || typeof text !== 'string') return text;

  const matches = detectPII(text, options);
  if (matches.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  for (const match of matches) {
    if (match.index < lastIndex) continue;

    result += text.substring(lastIndex, match.index);
    const replacement = options.maskInsteadOfRedact
      ? maskSensitiveValue(match.value, match.type)
      : match.placeholder;

    result += replacement;
    lastIndex = match.index + match.length;
  }

  result += text.substring(lastIndex);
  return result;
}


// ==========================================
// 2. Input Validation & Sanitization
// ==========================================

export interface SanitizeOptions {
  stripHtml?: boolean;
  trimWhitespace?: boolean;
  stripPII?: boolean;
  maxCharacters?: number;
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;'
};

/**
 * Escapes characters that could be dangerous in an HTML/XML context
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'/`]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips HTML tags and script contents completely, while preserving non-tag brackets
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/?(?:[a-zA-Z][a-zA-Z0-9:-]*)(?:\s+[^>]*)?\/?>/g, '')
    .trim();
}

/**
 * Analysis result for prompt injection detection
 */
export interface PromptInjectionAnalysis {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
}

const SUSPICIOUS_PROMPT_PATTERNS = [
  { pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i, reason: 'Attempt to override system instructions' },
  { pattern: /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i, reason: 'Attempt to override instructions' },
  { pattern: /you\s+are\s+now\s+(?:DAN|jailbreak|unfiltered|an?\s+unrestricted)/i, reason: 'Jailbreak persona attempt' },
  { pattern: /(?:system\s+prompt|developer\s+mode|hidden\s+instruction)\s*[:=]/i, reason: 'System prompt extraction or manipulation' },
  { pattern: /<\|(?:im_start|im_end|endoftext)\|>/i, reason: 'Delimiter / token injection attempt' },
  { pattern: /repeat\s+(?:the\s+)?(?:text|words|instructions)\s+above/i, reason: 'System prompt exfiltration attempt' },
  { pattern: /reveal\s+(?:your\s+)?(?:initial|system)\s+(?:prompt|instructions)/i, reason: 'System prompt leak request' }
];

export function detectPromptInjection(input: string): PromptInjectionAnalysis {
  if (!input || typeof input !== 'string') {
    return { isSuspicious: false, reasons: [], riskScore: 0 };
  }

  const reasons: string[] = [];
  for (const { pattern, reason } of SUSPICIOUS_PROMPT_PATTERNS) {
    if (pattern.test(input)) {
      reasons.push(reason);
    }
  }

  const riskScore = Math.min(1, reasons.length * 0.4);
  return {
    isSuspicious: reasons.length > 0,
    reasons,
    riskScore
  };
}

/**
 * Detects potential SQL Injection signatures in inputs
 */
export function detectSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\b(?:SELECT|UNION|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b.+?\b(?:FROM|INTO|TABLE|SET|WHERE)\b)/i,
    /(--|#|\/\*).*?$/,
    /(\bOR\b|\bAND\b)\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
    /;\s*(?:DROP|ALTER|DELETE|UPDATE)/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * General-purpose string sanitizer
 */
export function sanitizeString(input: string, options: SanitizeOptions = {}): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  if (options.stripPII) {
    sanitized = stripPII(sanitized);
  }

  if (options.stripHtml) {
    sanitized = stripHtml(sanitized);
  }

  if (options.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (options.maxCharacters && sanitized.length > options.maxCharacters) {
    sanitized = sanitized.slice(0, options.maxCharacters);
  }

  return sanitized;
}

/**
 * Deeply sanitizes an object or array by applying string sanitization to all nested string fields
 */
export function sanitizeObject<T>(input: T, options: SanitizeOptions = {}): T {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return sanitizeString(input, options) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeObject(item, options)) as unknown as T;
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = sanitizeObject(value, options);
    }
    return result as T;
  }

  return input;
}


// ==========================================
// 3. Validation Rules and Placeholder Schemas
// ==========================================

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  disallowPII?: boolean;
  disallowPromptInjection?: boolean;
  disallowSqlInjection?: boolean;
  customValidator?: (value: unknown) => string | null;
}

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: T;
}

/**
 * Validates an input record against schema rules
 */
export function validateInput<T extends Record<string, any>>(
  data: unknown,
  schema: Record<keyof T, FieldValidationRule>
): ValidationResult<T> {
  const errors: Record<string, string> = {};

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: { _root: 'Input must be a non-null object' }
    };
  }

  const record = data as Record<string, any>;
  const sanitized: Record<string, any> = {};

  for (const [key, rule] of Object.entries(schema) as [keyof T, FieldValidationRule][]) {
    const value = record[key as string];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[key as string] = `${String(key)} is required`;
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors[key as string] = `${String(key)} must be at least ${rule.minLength} characters long`;
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors[key as string] = `${String(key)} cannot exceed ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[key as string] = `${String(key)} has an invalid format`;
      }
      if (rule.disallowPII && containsPII(value)) {
        errors[key as string] = `${String(key)} contains prohibited personally identifiable information`;
      }
      if (rule.disallowPromptInjection) {
        const injection = detectPromptInjection(value);
        if (injection.isSuspicious) {
          errors[key as string] = `${String(key)} contains potentially malicious prompt instructions`;
        }
      }
      if (rule.disallowSqlInjection && detectSqlInjection(value)) {
        errors[key as string] = `${String(key)} contains potentially malicious query characters`;
      }

      sanitized[key as string] = value.trim();
    } else {
      sanitized[key as string] = value;
    }

    if (rule.customValidator) {
      const customErr = rule.customValidator(value);
      if (customErr) {
        errors[key as string] = customErr;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: Object.keys(errors).length === 0 ? (sanitized as T) : undefined
  };
}


// ==========================================
// 4. Security Headers & Request Middleware Helpers
// ==========================================

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  isProduction?: boolean;
}

/**
 * Returns recommended baseline security headers for PublishAI web and API responses
 */
export function getSecurityHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  const isProd = config.isProduction ?? process.env.NODE_ENV === 'production';

  const defaultCsp = config.contentSecurityPolicy || [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://e2b.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Content-Security-Policy': defaultCsp
  };

  if (isProd) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Generic request interface compatible with web standard Request, NextRequest, and test mocks
 */
export interface RequestLike {
  method?: string;
  headers: {
    get(name: string): string | null | undefined;
  } | Record<string, string | string[] | undefined>;
}

export interface RequestSecurityCheckOptions {
  maxPayloadBytes?: number;
  allowedOrigins?: string[];
}

function getHeaderValue(headers: RequestLike['headers'], name: string): string | null {
  if (typeof (headers as any)?.get === 'function') {
    return (headers as any).get(name) || null;
  }
  const record = headers as Record<string, string | string[] | undefined>;
  const val = record[name.toLowerCase()] ?? record[name];
  if (Array.isArray(val)) return val[0] || null;
  return val || null;
}

/**
 * Validates basic request security
 */
export function validateRequestSecurity(
  request: RequestLike,
  options: RequestSecurityCheckOptions = {}
): { isAllowed: boolean; statusCode?: number; error?: string } {
  const maxBytes = options.maxPayloadBytes || 10 * 1024 * 1024; // 10MB default
  const contentLength = getHeaderValue(request.headers, 'content-length');

  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return {
      isAllowed: false,
      statusCode: 413,
      error: 'Payload Too Large'
    };
  }

  const method = (request.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isStateChanging && options.allowedOrigins && options.allowedOrigins.length > 0) {
    const origin = getHeaderValue(request.headers, 'origin');
    if (origin && !options.allowedOrigins.includes(origin)) {
      return {
        isAllowed: false,
        statusCode: 403,
        error: 'Forbidden: Invalid Request Origin'
      };
    }
  }

  return { isAllowed: true };
}
