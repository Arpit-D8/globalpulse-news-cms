import { AppError } from "./AppError";

/**
 * Unauthorized error — the caller lacks valid authentication credentials.
 *
 * Typical usage: missing or invalid session token.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, options: { errorCode?: string } = {}) {
    super(message, {
      statusCode: 401,
      errorCode: options.errorCode ?? "UNAUTHORIZED_ERROR",
      isOperational: true,
    });

    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
