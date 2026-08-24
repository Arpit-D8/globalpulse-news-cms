type EmptyStateProps = {
  title: string;
  message?: string;
};

/**
 * Reusable empty-state component for entity lists.
 *
 * Displays a centered message when no entities exist or no search results match.
 * Fully generic — no entity-specific text or logic.
 */
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-base font-bold text-neutral-500">{title}</p>
      {message && (
        <p className="mt-1 text-sm font-medium text-neutral-400">{message}</p>
      )}
    </div>
  );
}
