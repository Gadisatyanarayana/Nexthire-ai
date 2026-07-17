export class BaseError extends Error {
  constructor(message: string, public readonly metadata?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {}
export class ImportError extends BaseError {}
export class DuplicateError extends BaseError {}
export class TaxonomyError extends BaseError {}
export class AssessmentError extends BaseError {}
export class AuthorizationError extends BaseError {}
export class InfrastructureError extends BaseError {}
export class ExternalServiceError extends BaseError {}
