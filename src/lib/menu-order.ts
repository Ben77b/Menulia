/** Positional fields used by the dashboard menu builder. */
export type MenuOrderable = {
  order_index?: number | null;
  display_order?: number | null;
};

function toFiniteOrder(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Positional comparator matching the dashboard builder.
 * Uses only `order_index` / `display_order` — returns 0 on ties so Array.sort
 * stays stable and preserves the exact sequence from the DB/query payload.
 * Never falls back to name, created_at, or id.
 */
export function compareMenuOrder(a: MenuOrderable, b: MenuOrderable): number {
  const orderA = toFiniteOrder(a.order_index) ?? toFiniteOrder(a.display_order) ?? 0;
  const orderB = toFiniteOrder(b.order_index) ?? toFiniteOrder(b.display_order) ?? 0;
  return orderA - orderB;
}

/** Stable positional sort — mirrors dashboard array indices only. */
export function sortByMenuOrder<T extends MenuOrderable>(
  records: readonly T[] | null | undefined
): T[] {
  return [...(records ?? [])].sort(compareMenuOrder);
}
