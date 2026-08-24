import { useState, useEffect, useRef, useCallback } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import type { ChangeEvent } from "react";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PLACEHOLDER =
  "Search by filename, alt text, creator or format";
const DEFAULT_DEBOUNCE_MS = 400;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Reusable debounced search input for the admin media library.
 *
 * A controlled component that notifies the parent of value changes only
 * after a configurable debounce delay (default 400ms). Supports immediate
 * clearing via an X button when text is present.
 *
 * Features:
 * - Debounced onChange via useEffect watching localValue
 * - Timer cleanup on unmount and value changes
 * - Clear button that cancels pending debounce and calls onChange("")
 * - Accessible with hidden label, aria-labels, and keyboard support
 * - No API calls or data-fetching dependencies
 */
export default function MediaSearch({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: MediaSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const hasUserEditedRef = useRef(false);

  // Sync local state when the controlled value changes externally (only if user hasn't edited).
  useEffect(() => {
    if (!hasUserEditedRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounce: call onChange after the configured delay when localValue changes.
  // Skip the first render to avoid calling onChange on mount.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear any pending timer.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Schedule the debounced callback.
    timerRef.current = setTimeout(() => {
      onChange(localValue);
      timerRef.current = null;
    }, debounceMs);

    // Cleanup on unmount or when localValue/debounceMs changes.
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [localValue, debounceMs, onChange]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      hasUserEditedRef.current = true;
      setLocalValue(e.target.value);
    },
    []
  );

  const handleClear = useCallback(() => {
    // Cancel any pending debounce.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Reset state and notify parent immediately.
    setLocalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className="relative w-full">
      {/* Hidden accessible label */}
      <label htmlFor="media-search" className="sr-only">
        Search media
      </label>

      {/* Search icon */}
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        <FaMagnifyingGlass
          className="text-sm text-neutral-400"
          aria-hidden="true"
        />
      </div>

      {/* Input */}
      <input
        id="media-search"
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Search media"
        className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 transition hover:text-neutral-700"
        >
          <FaXmark className="text-sm" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
