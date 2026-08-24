import type { Category, CategoryCreateInput, CategoryUpdateInput } from "@/lib/types/category";

const BASE = "/api/admin/categories";

/**
 * Extended Error type with HTTP status code attached by API routes.
 */
interface HttpError extends Error {
  statusCode?: number;
}

/**
 * Client-side API wrapper for the Category endpoints.
 *
 * Uses the shared apiHandler response shape: { success, data } / { success, message }.
 */
export const categoryClient = {
  /**
   * Fetch all categories, optionally filtering by isActive.
   */
  async list(isActive?: boolean): Promise<Category[]> {
    const url = new URL(BASE, window.location.origin);
    if (isActive !== undefined) {
      url.searchParams.set("isActive", String(isActive));
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch categories");
    }

    return json.data ?? [];
  },

  /**
   * Fetch a single category by _id.
   */
  async getById(id: string): Promise<Category> {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch category: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch category");
    }

    return json.data;
  },

  /**
   * Create a new category.
   */
  async create(input: CategoryCreateInput): Promise<Category> {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to create category");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Update an existing category by _id.
   */
  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to update category");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Toggle a category's isActive status.
   */
  async toggle(id: string): Promise<Category> {
    const res = await fetch(`${BASE}/${id}/toggle`, {
      method: "PATCH",
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to toggle category");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Delete a category by _id (soft delete).
   */
  async delete(id: string): Promise<Category> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to delete category");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },
};
