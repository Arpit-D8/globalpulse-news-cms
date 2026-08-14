import { AppError } from "./AppError";

/**
 * Validation error — the request contained invalid data.
 *
 * Typical usage: thrown by service layers after input validation fails.
 */
export class ValidationError extends AppError {
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    options: {
      errorCode?: string;
      details?: Record<string, string>;
    } = {}
  ) {
    super(message, {
      statusCode: 400,
      errorCode: options.errorCode ?? "VALIDATION_ERROR",
      isOperational: true,
    });

    this.name = "ValidationError";
    this.details = options.details;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
