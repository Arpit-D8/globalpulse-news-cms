/**
 * Failure-isolation helpers for server components.
 *
 * Wraps independent data-fetching operations in `Promise.allSettled` so that
 * a failure in one section (e.g. breaking news) does not prevent other
 * sections (hero, latest, categories) from rendering.
 *
 * Usage:
 *   const results = await allSettledWithFallback({
 *     hero:      () => getHeroArticle(),
 *     latest:    () => getLatestArticles(),
 *     breaking:  () => getBreakingArticles(),
 *   }, { fallback: { hero: null, latest: [], breaking: [] } });
 *
 *   // results.hero.value  — or results.hero.reason on failure
 */

/** Shape of a single settled result. */
type Settled<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

/** Map of named async operations → their settled results. */
export type SettledMap<T extends Record<string, unknown>> = {
  [K in keyof T]: Settled<T[K]>;
};

/**
 * Run multiple async operations concurrently, catching all rejections.
 *
 * @param operations — Record of named functions that return promises.
 * @param options.fallback — Default values returned when an operation rejects.
 * @returns Record where each key holds either a fulfilled value or a { status, reason } object.
 */
export async function allSettledWithFallback<T extends Record<string, () => Promise<unknown>>>(
  operations: T,
  options?: {
    fallback?: {
      [K in keyof T]: Awaited<ReturnType<T[K]>>;
    };
  }
): Promise<Record<keyof T, unknown>> {
  const entries = Object.entries(operations) as [keyof T, () => Promise<unknown>][];

  const promises = entries.map(([, fn]) => fn());
  const settled = await Promise.allSettled(promises);

  const result = {} as Record<keyof T, unknown>;

  entries.forEach(([key], index) => {
    const s = settled[index];

    if (s && typeof s === "object" && "status" in s && (s as any).status === "fulfilled") {
      result[key] = (s as any).value;
    } else if (options?.fallback && key in options.fallback) {
      result[key] = options.fallback[key];
    } else {
      result[key] = s; // rejections surface the raw reason
    }
  });

  return result;
}

/**
 * Run multiple async operations concurrently and return only the fulfilled ones.
 *
 * Useful when you want to silently skip failed sections rather than showing
 * fallback data.
 *
 * @returns Record of only the operations that resolved successfully.
 */
export async function allSettledSilent<T extends Record<string, () => Promise<unknown>>>(
  operations: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(operations) as [string, () => Promise<unknown>][];
  const promises = entries.map(([, fn]) => fn());
  const settled = await Promise.allSettled(promises);

  const result = {} as Record<string, unknown>;

  entries.forEach(([key], index) => {
    const s = settled[index] as Settled<unknown>;
    if (s.status === "fulfilled") {
      result[key] = s.value;
    }
  });

  return result as any;
}
