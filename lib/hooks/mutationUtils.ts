import type { Dispatch, SetStateAction } from "react";

/**
 * Executes an async mutation with standardized error handling.
 *
 * - Clears the error state before execution
 * - Executes the operation
 * - On error: extracts message, sets error state, re-throws original error
 *
 * The caller should perform optimistic updates AFTER this resolves
 * (only on success), and may omit try/catch since error state is managed here.
 *
 * @param operation - Async function to execute
 * @param setError - Caller's setState for error state
 * @param fallbackMessage - Message to use if caught error is not an Error instance
 * @returns The operation's result on success
 */
export async function executeMutation<T>(
  operation: () => Promise<T>,
  setError: Dispatch<SetStateAction<string | null>>,
  fallbackMessage: string,
): Promise<T> {
  setError(null);
  try {
    return await operation();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : fallbackMessage;
    setError(message);
    throw err;
  }
}
