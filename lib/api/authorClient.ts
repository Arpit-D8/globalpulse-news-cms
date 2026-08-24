import type { Author, AuthorCreateInput, AuthorUpdateInput } from "@/lib/types/author";

const BASE = "/api/admin/authors";

/**
 * Extended Error type with HTTP status code attached by API routes.
 */
interface HttpError extends Error {
  statusCode?: number;
}

/**
 * Client-side API wrapper for the Author endpoints.
 *
 * Uses the shared apiHandler response shape: { success, data } / { success, message }.
 */
export const authorClient = {
  /**
   * Fetch all authors, optionally filtering by isActive.
   */
  async getAuthors(isActive?: boolean): Promise<Author[]> {
    const url = new URL(BASE, window.location.origin);
    if (isActive !== undefined) {
      url.searchParams.set("isActive", String(isActive));
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Failed to fetch authors: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch authors");
    }

    return json.data ?? [];
  },

  /**
   * Fetch a single author by _id.
   */
  async getAuthor(id: string): Promise<Author> {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch author: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch author");
    }

    return json.data;
  },

  /**
   * Create a new author.
   */
  async createAuthor(data: AuthorCreateInput): Promise<Author> {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to create author");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Update an existing author by _id.
   */
  async updateAuthor(id: string, data: AuthorUpdateInput): Promise<Author> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to update author");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Toggle an author's isActive status.
   */
  async toggleAuthorStatus(id: string): Promise<Author> {
    const res = await fetch(`${BASE}/${id}/toggle`, {
      method: "PATCH",
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to toggle author");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },

  /**
   * Delete an author by _id (soft delete).
   */
  async deleteAuthor(id: string): Promise<Author> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to delete author");
      (err as unknown as HttpError).statusCode = res.status;
      throw err;
    }

    return json.data;
  },
};
