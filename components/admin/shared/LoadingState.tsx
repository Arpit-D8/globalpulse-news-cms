type LoadingStateProps = {
  message?: string;
};

/**
 * Reusable loading state component.
 *
 * Displays a centered spinner with a message while data is being fetched.
 */
export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-16 text-center">
      <svg
        className="mx-auto size-6 animate-spin text-neutral-400"
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
      <p className="mt-4 text-sm font-bold text-neutral-500">{message}</p>
    </div>
  );
}
