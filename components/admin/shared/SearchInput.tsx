"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchInputProps = {
  /** Current search value. */
  value: string;
  /** Called with the native change event so callers can apply their own debounce. */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Input placeholder text. */
  placeholder: string;
  /** Accessibility label for the search input. */
  "aria-label": string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational search input for admin list pages.
 *
 * Styling is intentionally locked to the exact class string used across
 * Articles and Categories pages so there are zero visual differences when
 * this shared component is used.
 *
 * This component is purely presentational — no debounce logic, no API calls.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
      aria-label={ariaLabel}
    />
  );
}
