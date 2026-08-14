import { auth } from "@/lib/auth";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

/**
 * Verify that the caller is authenticated and has administrator privileges.
 *
 * Throws UnauthorizedError (status 401) when no valid session exists.
 * Throws ForbiddenError (status 403) when the authenticated user lacks admin role.
 * Returns the NextAuth session object when both checks pass.
 *
 * Usage inside an API route:
 *   await requireAdmin();          // throw on failure, return session on success
 *   return handleService(async () => { ... });
 *
 * The thrown errors are caught by handleService() which converts them into
 * { success: false, error: { message, details } } responses with the
 * appropriate HTTP status code.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (session.user?.role !== "admin") {
    throw new ForbiddenError("Forbidden");
  }

  return session;
}
