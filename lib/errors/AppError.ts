/**
 * Base application error.
 *
 * All custom errors in this project extend AppError. It provides a consistent
 * shape for operational errors (expected failures that the caller can handle)
 * versus system errors (unexpected crashes that require investigation).
 *
 * Framework-agnostic — no Next.js or Express dependencies.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      errorCode?: string;
      isOperational?: boolean;
    } = {}
  ) {
    super(message);

    this.statusCode = options.statusCode ?? 500;
    this.errorCode = options.errorCode ?? "INTERNAL_ERROR";
    this.isOperational = options.isOperational ?? true;

    // Preserve the correct prototype chain.
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture the stack trace at the point of instantiation.
    Error.captureStackTrace(this, this.constructor);
  }
}
