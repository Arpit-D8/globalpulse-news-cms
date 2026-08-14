import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@/lib/errors";

/**
 * Validate a Zod schema against raw input and throw ValidationError on failure.
 *
 * Converts ZodError field errors into the ValidationError format expected by
 * handleService (details: Record<string, string>).
 *
 * @param schema — Zod schema to validate against
 * @param data — Raw input (typically request.json())
 * @returns Validated and coerced data
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const details: Record<string, string> = {};
      for (const issue of err.issues) {
        const path = issue.path.join(".");
        if (path) {
          details[path] = issue.message;
        }
      }
      throw new ValidationError("Request validation failed", { details });
    }
    throw err;
  }
}
