/**
 * Shared string utilities for admin services and components.
 */

/**
 * Escape special regular-expression characters in a string.
 *
 * Prevents ReDoS and regex-syntax errors when user input is embedded in
 * RegExp patterns.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Truncate a string to a maximum length, appending "…" if cut off.
 *
 * @param text - The string to truncate.
 * @param maxLength - Maximum length before truncation (default: 40).
 * @returns The truncated string.
 */
export function truncate(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
