export interface AIErrorDetails {
  success: false;
  code: string;
  retryable: boolean;
  stage: string;
  message: string;
  requestId: string;
}

export class AIException extends Error {
  public details: AIErrorDetails;

  constructor(details: AIErrorDetails) {
    super(details.message);
    this.name = 'AIException';
    this.details = details;
  }
}

export const AIErrorCodes = {
  TIMEOUT: 'AI_TIMEOUT',
  RATE_LIMIT: 'AI_RATE_LIMIT',
  INVALID_JSON: 'AI_INVALID_JSON',
  PARTIAL_RESPONSE: 'AI_PARTIAL_RESPONSE',
  PROVIDER_OUTAGE: 'AI_PROVIDER_OUTAGE',
  USER_CANCELLATION: 'AI_USER_CANCELLATION',
  MISSING_API_KEY: 'AI_MISSING_API_KEY',
  UNAUTHORIZED: 'AI_UNAUTHORIZED',
  VALIDATION_ERROR: 'AI_VALIDATION_ERROR',
} as const;
