import { getImage, updateImageAlt, deleteImage } from "@/lib/services/media.service";
import { successResponse, handleService } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { mediaUpdateSchema } from "@/lib/validation/media";

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Extract and validate the media ID from route params.
 *
 * Throws ValidationError if the id is missing or empty.
 */
function getId(params: { id: string }): string {
  const { id } = params;

  if (!id) {
    throw new ValidationError("Media ID is required");
  }

  return id;
}

// ---------------------------------------------------------------------------
// GET /api/admin/media/[id]
// ---------------------------------------------------------------------------

/**
 * Retrieve a single media asset by its ID.
 *
 * Path param:
 *   - id : MongoDB ObjectId
 *
 * Returns the Media document with status 200 OK.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const media = await getImage(getId({ id }));
    return successResponse(media);
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/media/[id]
// ---------------------------------------------------------------------------

/**
 * Update the alt text for an existing media asset.
 *
 * Path param:
 *   - id : MongoDB ObjectId
 *
 * Body:
 *   - alt : new alt text (required, non-empty string)
 *
 * Returns the updated Media document with status 200 OK.
 */
export async function PATCH(
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
    const mediaId = getId({ id });

    const body = await request.json();
    const data = validate(mediaUpdateSchema, body);

    if (!data.alt || data.alt.trim().length === 0) {
      throw new ValidationError("Alt text must be a non-empty string");
    }

    const media = await updateImageAlt(mediaId, data.alt.trim());
    return successResponse(media);
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/media/[id]
// ---------------------------------------------------------------------------

/**
 * Delete a media asset by its ID.
 *
 * Path param:
 *   - id : MongoDB ObjectId
 *
 * Removes the document from MongoDB and the asset from Cloudinary.
 * Returns { success: true } with status 200 OK.
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
    await deleteImage(getId({ id }));
    return successResponse({ success: true });
  });
}
