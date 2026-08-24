import type { Category } from "@/lib/types/category";
import { CategoryRow } from "./CategoryRow";
import { EmptyState } from "@/components/admin/shared/EmptyState";

type CategoryTableProps = {
  categories: Category[];
  total: number;
  onEdit?: (category: Category) => void;
  onToggle?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  deletingId?: string;
};

export function CategoryTable({
  categories,
  total,
  onEdit,
  onToggle,
  onDelete,
  deletingId,
}: CategoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-6 py-5">
        <h3 className="text-base font-black tracking-tight text-neutral-950">
          Categories
        </h3>
        <span className="text-sm font-semibold text-neutral-500">
          {total} total
        </span>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories found."
          message="Create your first category to organize your newsroom content."
        />
      ) : (
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {categories.map((category) => (
              <CategoryRow
                key={category._id}
                category={category}
                onEdit={() => onEdit?.(category)}
                onToggle={() => onToggle?.(category)}
                onDelete={() => onDelete?.(category)}
                deletingId={deletingId}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
