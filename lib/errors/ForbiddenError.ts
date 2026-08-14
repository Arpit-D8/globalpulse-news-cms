import { AppError } from "./AppError";

/**
 * Forbidden error — the caller is authenticated but lacks permission.
 *
 * Typical usage: authenticated user trying to access a resource outside their role.
 */
export class ForbiddenError extends AppError {
  constructor(message: string, options: { errorCode?: string } = {}) {
    super(message, {
      statusCode: 403,
      errorCode: options.errorCode ?? "FORBIDDEN_ERROR",
      isOperational: true,
    });

    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
