import { AppError } from "./AppError";

/**
 * Not found error — the requested resource does not exist.
 *
 * Typical usage: entity not found in the database.
 */
export class NotFoundError extends AppError {
  constructor(message: string, options: { errorCode?: string } = {}) {
    super(message, {
      statusCode: 404,
      errorCode: options.errorCode ?? "NOT_FOUND_ERROR",
      isOperational: true,
    });

    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
