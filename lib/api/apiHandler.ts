import { NextResponse, type NextRequest } from "next/server";
import type { AppError } from "@/lib/errors/AppError";
import { successResponse, errorResponse } from "./response";

/**
 * Type guard — check if an error is an instance of AppError (or subclass).
 */
function isAppError(error: unknown): error is AppError {
  return (
    error != null &&
    typeof error === "object" &&
    "statusCode" in error &&
    "errorCode" in error &&
    "isOperational" in error
  );
}

/**
 * Create a NextResponse from an error.
 *
 * AppError subclasses are converted to HTTP responses using their
 * statusCode and errorCode. Unexpected errors default to 500.
 */
function errorToResponse(error: unknown): NextResponse {
  if (isAppError(error)) {
    return errorResponse(error.message, error.statusCode);
  }

  // Fallback for unknown errors.
  const message =
    error instanceof Error ? error.message : "Internal Server Error";
  console.error("[apiHandler] Unexpected error:", error);
  return errorResponse(message, 500);
}

/**
 * A reusable API handler factory.
 *
 * Returns an async function compatible with Next.js App Router route handlers.
 * The inner handler receives the request and route params, and should contain
 * only business logic delegation (no try/catch or response wrapping).
 *
 * Usage:
 *   export const GET = apiHandler(async (request, params) => {
 *     const data = await someService();
 *     return data;
 *   });
 *
 * The handler automatically:
 *   - Executes the inner function
 *   - Catches exceptions
 *   - Detects AppError subclasses and maps their statusCode
 *   - Returns a consistent { success, data } or { success, message } JSON response
 *   - Logs unexpected errors to console.error
 */
export function apiHandler<TParams = Record<string, string>>(
  handler: (
    request: NextRequest,
    params: TParams
  ) => Promise<unknown>
) {
  return async (
    request: NextRequest,
    params: TParams
  ): Promise<NextResponse> => {
    try {
      const result = await handler(request, params);
      return successResponse(result);
    } catch (error) {
      return errorToResponse(error);
    }
  };
}
