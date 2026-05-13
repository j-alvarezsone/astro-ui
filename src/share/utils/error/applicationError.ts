/**
 * Base application error with code, status, and structured details.
 */
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  /**
   * Creates a new application error.
   *
   * @param message - Human-readable error message.
   * @param code - Stable machine-readable error code.
   * @param statusCode - HTTP-like status code associated with the error.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message: string, code: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace?.(this, new.target);
  }
}

/**
 * Error used for invalid input or request payloads.
 */
export class ValidationError extends ApplicationError {
  /**
   * Creates a new validation error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error used when a request is malformed or cannot be processed.
 */
export class BadRequestError extends ApplicationError {
  /**
   * Creates a new bad-request error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

/**
 * Error used when authentication is required or has failed.
 */
export class UnauthorizedError extends ApplicationError {
  /**
   * Creates a new unauthorized error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

/**
 * Error used when the current user cannot access a resource.
 */
export class ForbiddenError extends ApplicationError {
  /**
   * Creates a new forbidden error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

/**
 * Error used when a resource cannot be found.
 */
export class NotFoundError extends ApplicationError {
  /**
   * Creates a new not-found error.
   *
   * @param resource - Resource name.
   * @param id - Resource identifier.
   */
  constructor(resource: string, id: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource, id });
  }
}

/**
 * Error used for non-OK HTTP responses.
 */
export class HttpError extends ApplicationError {
  /**
   * Creates a new HTTP error.
   *
   * @param statusCode - HTTP status code.
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(statusCode: number, message: string, details?: Record<string, unknown>) {
    super(message, 'HTTP_ERROR', statusCode, details);
  }
}

/**
 * Error used when a request conflicts with current resource state.
 */
export class ConflictError extends ApplicationError {
  /**
   * Creates a new conflict error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Error used when a request is syntactically valid but semantically invalid.
 */
export class UnprocessableEntityError extends ApplicationError {
  /**
   * Creates a new unprocessable-entity error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'UNPROCESSABLE_ENTITY', 422, details);
  }
}

/**
 * Error used when a payload cannot be parsed as JSON.
 */
export class ParseError extends ApplicationError {
  /**
   * Creates a new parse error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message = 'Invalid JSON response', details?: Record<string, unknown>) {
    super(message, 'PARSE_ERROR', 400, details);
  }
}

/**
 * Error used when the service is temporarily unavailable.
 */
export class ServiceUnavailableError extends ApplicationError {
  /**
   * Creates a new service-unavailable error.
   *
   * @param message - Human-readable error message.
   * @param details - Optional structured details for diagnostics.
   */
  constructor(message = 'Service unavailable', details?: Record<string, unknown>) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}
