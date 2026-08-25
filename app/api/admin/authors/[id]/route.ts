import {
  getAuthorByIdOrThrow,
  updateAuthor,
  deleteAuthor,
} from "@/lib/services/author.service";
import { handleService, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { authorUpdateSchema } from "@/lib/validation/author";

// ---------------------------------------------------------------------------
// GET /api/admin/authors/[id]
// ---------------------------------------------------------------------------

/**
 * Get a single author by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const author = await getAuthorByIdOrThrow(id);
    return successResponse(author);
  });
}

// ---------------------------------------------------------------------------
// PUT /api/admin/authors/[id]
// ---------------------------------------------------------------------------

/**
 * Update an existing author.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = validate(authorUpdateSchema, body);
    const author = await updateAuthor(id, data);
    return successResponse(author);
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/authors/[id]
// ---------------------------------------------------------------------------

/**
 * Delete an author by ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const author = await deleteAuthor(id);
    return successResponse(author);
  });
}
