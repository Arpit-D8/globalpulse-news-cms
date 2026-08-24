import Link from "next/link";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";

type CategoryNavVariant = "light" | "dark";

const variantStyles: Record<CategoryNavVariant, string> = {
  light:
    "border border-neutral-300 text-neutral-800 hover:border-red-700 hover:bg-red-700 hover:text-white",
  dark:
    "border border-neutral-700 text-neutral-300 hover:border-white hover:text-white",
};

export function CategoryNav({ variant = "light" }: { variant?: CategoryNavVariant }) {
  const style = variantStyles[variant];

  return (
    <nav aria-label="Category navigation" className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/category/${CATEGORY_CONFIG[category].slug}`}
          className={`${style} px-3 py-2 text-sm font-bold uppercase transition`}
        >
          {category}
        </Link>
      ))}
    </nav>
  );
}
