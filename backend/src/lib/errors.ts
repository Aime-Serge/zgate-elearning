/**
 * Error taxonomy - see docs/backend/ERROR_HANDLING.md. One shared shape
 * for every error response; route handlers throw these, a single Fastify
 * error handler (registered in app.ts) turns them into the HTTP response.
 * Never include implementation detail (stack traces, DB errors) in the
 * client-facing message - that's logged server-side only.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    if (fields) {
      this.fields = fields;
    }
  }
}

export function validationError(fields: Record<string, string>): AppError {
  return new AppError("VALIDATION_ERROR", "Please fix the highlighted fields.", fields);
}
