import { AppError } from "./AppError";

/**
 * Internal server error — an unexpected system failure.
 *
 * Typical usage: database connection down, unhandled exception.
 * Unlike other errors, this is NOT operational — it signals a bug or infrastructure issue.
 */
export class InternalServerError extends AppError {
  constructor(
    message: string,
    options: {
      errorCode?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      statusCode: 500,
      errorCode: options.errorCode ?? "INTERNAL_SERVER_ERROR",
      isOperational: false,
    });

    this.name = "InternalServerError";
    Object.setPrototypeOf(this, InternalServerError.prototype);

    // Attach the original error for logging purposes.
    if (options.cause) {
      (this as unknown as { cause?: Error }).cause = options.cause;
    }
  }
}
