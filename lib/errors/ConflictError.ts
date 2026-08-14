import { AppError } from "./AppError";

/**
 * Conflict error — the request conflicts with the current state of the resource.
 *
 * Typical usage: duplicate slug, unique constraint violation.
 */
export class ConflictError extends AppError {
  constructor(message: string, options: { errorCode?: string } = {}) {
    super(message, {
      statusCode: 409,
      errorCode: options.errorCode ?? "CONFLICT_ERROR",
      isOperational: true,
    });

    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
