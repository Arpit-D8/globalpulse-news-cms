import { NextResponse } from "next/server";
import { seedCategories } from "@/lib/seed-categories";
import { requireAdmin } from "@/lib/auth-guard";
import { handleService } from "@/lib/api/response";

// ---------------------------------------------------------------------------
// POST /api/admin/categories/seed
// ---------------------------------------------------------------------------

/**
 * Seed the standard categories (India, World, Business, Technology, Sports).
 *
 * Idempotent — existing categories are updated, new ones are created.
 * Admin authentication required.
 */
export async function POST() {
  await requireAdmin();

  return handleService(async () => {
    const result = await seedCategories();
    return NextResponse.json(
      {
        success: true,
        message: `Categories seeded: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
        data: result,
      },
      { status: 200 }
    );
  });
}
