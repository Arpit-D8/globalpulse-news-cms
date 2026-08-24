import { NextRequest } from "next/server";
import { listImages, uploadImage } from "@/lib/services/media.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { mediaUploadSchema } from "@/lib/validation/media";

// ---------------------------------------------------------------------------
// GET /api/admin/media
// ---------------------------------------------------------------------------

/**
 * List media with search, sort, and pagination.
 *
 * Query params:
 *   - page  : page number (default 1)
 *   - limit : items per page (default 10)
 *   - search: substring match on publicId, alt, createdBy, or format
 *   - sort  : "newest" | "oldest" (default "newest")
 */
export async function GET(request: Request) {
  return handleService(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
    const search = searchParams.get("search") || "";

    const rawSort = searchParams.get("sort") || "";
    const sort = rawSort === "oldest" ? "oldest" : "newest";

    const { media, pagination } = await listImages({ page, limit, search, sort });
    return successResponse({ media, pagination });
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/media
// ---------------------------------------------------------------------------

/**
 * Upload a new media asset.
 *
 * Accepts JSON body:
 *   - file      : base64-encoded data URL or direct URL (required)
 *   - alt       : alt text for the image (optional, defaults to "")
 *   - createdBy : creator identifier (optional, defaults to "Admin")
 *
 * Validates input, uploads to Cloudinary, persists metadata to MongoDB,
 * and returns the created Media document with status 201 Created.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const body = await request.json();
    const data = validate(mediaUploadSchema, body);
    const media = await uploadImage(data.file, { alt: data.alt, createdBy: data.createdBy });
    return successResponse(media, 201);
  });
}
