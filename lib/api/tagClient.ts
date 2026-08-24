import type { AdminTag } from "@/lib/types/admin-tag";

const BASE = "/api/admin/tags";

/**
 * Extended Error type with HTTP status code attached by API routes.
 */
interface HttpError extends Error {
  statusCode?: number;
}

/**
 * Client-side API wrapper for the Tag endpoints.
 *
 * Uses the shared apiHandler response shape: { success, data } / { success, message }.
 */
export const tagClient = {
  /**
   * Fetch ALL active tags (no pagination).
   */
  async getAll(): Promise<AdminTag[]> {
    const res = await fetch(`${BASE}/all`);
    if (!res.ok) {
      throw new Error(`Failed to fetch all tags: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch all tags");
    }

    return json.data;
  },

  /**
   * Fetch a paginated list of tags with optional search and isActive filter.
   */
  async list(options?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ tags: AdminTag[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.isActive !== undefined) params.set("isActive", String(options.isActive));
    if (options?.page) params.set("page", String(options.page));
    if (options?.limit) params.set("limit", String(options.limit));

    const url = `${BASE}${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch tags: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch tags");
    }

    return json.data;
  },

  /**
   * Fetch a single tag by _id.
   */
  async getById(id: string): Promise<AdminTag> {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch tag: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch tag");
    }

    return json.data;
  },

  /**
   * Update an existing tag by _id.
   */
  async update(id: string, input: {
    name: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<AdminTag> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to update tag");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Toggle a tag's isActive status.
   */
  async toggle(id: string): Promise<AdminTag> {
    const res = await fetch(`${BASE}/${id}/toggle`, {
      method: "PATCH",
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to toggle tag");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Delete a tag by _id (soft delete).
   */
  async delete(id: string): Promise<AdminTag> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to delete tag");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },
};
