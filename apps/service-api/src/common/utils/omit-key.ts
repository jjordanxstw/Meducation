/**
 * Returns a shallow copy of `row` without `key`. Used to strip helper embeds
 * (e.g. a parent's `is_active` pulled in for filtering) from API responses.
 */
export function omitKey<T extends Record<string, unknown>, K extends string>(row: T, key: K): Omit<T, K> {
  const copy = { ...row };
  delete copy[key];
  return copy;
}
