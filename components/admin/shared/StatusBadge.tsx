"use client";

type StatusBadgeProps = {
  label: string;
  active: boolean;
};

/**
 * Reusable status badge with a colored dot indicator.
 *
 * Displays an "Active"/"Inactive"-style badge with semantic coloring:
 * - active=true → green/emerald
 * - active=false → neutral/gray
 *
 * Fully generic — receives label and active state through props.
 */
export function StatusBadge({ label, active }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-neutral-200 text-neutral-600"
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          active ? "bg-emerald-500" : "bg-neutral-400"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
