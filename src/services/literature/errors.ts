/**
 * Literature Service Error Classes
 */

export class LiteratureApiError extends Error {
  readonly statusCode?: number;
  readonly source: 'pubmed' | 'crossref' | 'literature_service';
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      source: 'pubmed' | 'crossref' | 'literature_service';
      details?: unknown;
    }
  ) {
    super(message);
    this.name = 'LiteratureApiError';
    this.statusCode = options.statusCode;
    this.source = options.source;
    this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitError extends LiteratureApiError {
  readonly retryAfterSeconds?: number;

  constructor(
    source: 'pubmed' | 'crossref',
    message: string = 'API rate limit exceeded (HTTP 429)',
    retryAfterSeconds?: number
  ) {
    super(message, { statusCode: 429, source });
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends LiteratureApiError {
  readonly timeoutMs?: number;

  constructor(
    message: string,
    source: 'pubmed' | 'crossref' | 'literature_service' = 'literature_service',
    timeoutMs?: number,
    details?: unknown
  ) {
    super(message, { statusCode: 408, source, details });
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RemoteServerError extends LiteratureApiError {
  constructor(
    message: string,
    statusCode: number,
    source: 'pubmed' | 'crossref',
    details?: unknown
  ) {
    super(message, { statusCode, source, details });
    this.name = 'RemoteServerError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends LiteratureApiError {
  constructor(
    message: string,
    source: 'pubmed' | 'crossref'
  ) {
    super(message, { statusCode: 404, source });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
