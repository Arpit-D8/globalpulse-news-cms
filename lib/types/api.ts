/**
 * Shared API response types.
 *
 * Centralizes types that describe the shape of API responses consumed by
 * admin pages and other client-side components.
 */
import type { AdminMedia } from "@/lib/types/admin-media";

/**
 * Shape of the admin media library API response.
 */
export type MediaApiResponse = {
  success: boolean;
  data: {
    media: AdminMedia[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
};
