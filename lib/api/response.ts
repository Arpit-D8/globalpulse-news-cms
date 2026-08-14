import { NextResponse } from "next/server";
import { AppError, ValidationError } from "@/lib/errors";

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 500,
  details?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status }
  );
}

export async function handleService(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, error.statusCode, error.details);
    }

    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode);
    }

    console.error("[API Error]", error);
    return errorResponse("Internal Server Error", 500);
  }
}
