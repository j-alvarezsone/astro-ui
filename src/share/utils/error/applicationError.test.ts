import {
  ApplicationError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  NotFoundError,
  ParseError,
  ServiceUnavailableError,
  UnauthorizedError,
  UnprocessableEntityError,
  ValidationError,
} from '@utils/error/applicationError';

describe('application errors', () => {
  it('creates application errors with code and status', () => {
    const error = new ApplicationError('boom', 'APP_ERROR', 500, { reason: 'test' });

    expect(error.name).toBe('ApplicationError');
    expect(error.message).toBe('boom');
    expect(error.code).toBe('APP_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ reason: 'test' });
  });

  it('creates validation errors', () => {
    const error = new ValidationError('bad input', { field: 'organizationId' });

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });

  it('creates not found errors', () => {
    const error = new NotFoundError('User', 'u-1');

    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ resource: 'User', id: 'u-1' });
  });

  it('creates http errors', () => {
    const error = new HttpError(502, 'bad gateway', { upstream: 'api' });

    expect(error.code).toBe('HTTP_ERROR');
    expect(error.statusCode).toBe(502);
    expect(error.details).toEqual({ upstream: 'api' });
  });

  it('creates parse errors', () => {
    const error = new ParseError();

    expect(error.code).toBe('PARSE_ERROR');
    expect(error.statusCode).toBe(400);
  });

  it('creates bad request errors', () => {
    const error = new BadRequestError('bad request', { field: 'name' });

    expect(error.code).toBe('BAD_REQUEST');
    expect(error.statusCode).toBe(400);
  });

  it('creates unauthorized errors', () => {
    const error = new UnauthorizedError();

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.statusCode).toBe(401);
  });

  it('creates forbidden errors', () => {
    const error = new ForbiddenError();

    expect(error.code).toBe('FORBIDDEN');
    expect(error.statusCode).toBe(403);
  });

  it('creates conflict errors', () => {
    const error = new ConflictError('already exists');

    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
  });

  it('creates unprocessable entity errors', () => {
    const error = new UnprocessableEntityError('unprocessable');

    expect(error.code).toBe('UNPROCESSABLE_ENTITY');
    expect(error.statusCode).toBe(422);
  });

  it('creates service unavailable errors', () => {
    const error = new ServiceUnavailableError();

    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.statusCode).toBe(503);
  });
});
