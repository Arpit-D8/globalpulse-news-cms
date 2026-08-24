"use client";

import type { Category } from "@/lib/types/category";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

type CategoryRowProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onToggle?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  deletingId?: string;
};

export function CategoryRow({
  category,
  onEdit,
  onToggle,
  onDelete,
  deletingId,
}: CategoryRowProps) {
  const isDeleting = deletingId === category._id;
  return (
    <tr className="transition hover:bg-neutral-50">
      <td className="px-6 py-4 font-bold text-neutral-950">{category.name}</td>
      <td className="px-6 py-4 font-mono text-sm text-neutral-500">
        {category.slug}
      </td>
      <td className="px-6 py-4 text-sm text-neutral-600">
        {category.description || "—"}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-neutral-500">
        {category.displayOrder}
      </td>
      <td className="px-6 py-4">
        <StatusBadge
          label={category.isActive ? "Active" : "Inactive"}
          active={category.isActive}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              type="button"
              onClick={() => onToggle(category)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase transition hover:bg-neutral-200 hover:text-neutral-900"
              aria-label={`${category.isActive ? "Deactivate" : "Activate"} ${category.name}`}
              title={category.isActive ? "Deactivate" : "Activate"}
            >
              <svg
                className="size-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                {category.isActive ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752M9 13v3m3-3v3m-9.872.948a9.963 9.963 0 0 1 5.06-2.602m0 0 3.579-1.023a3.375 3.375 0 0 1 3.838 1.492 9.005 9.005 0 0 1 2.599 5.235m-9.75 1.5h3.75"
                  />
                )}
              </svg>
              {category.isActive ? "Off" : "On"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900"
            aria-label={`Edit ${category.name}`}
          >
            <svg
              className="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            Edit
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(category)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Delete ${category.name}`}
              title="Delete"
            >
              {isDeleting ? (
                <svg
                  className="size-3.5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <svg
                  className="size-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              )}
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
