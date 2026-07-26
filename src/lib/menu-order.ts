import { getLocalizedText } from "@/lib/utils/i18n-text";
import type { LocalizedTextValue } from "@/lib/localized-text";

/** Fields used for deterministic public-menu / dashboard ordering. */
export type MenuOrderable = {
  id?: string | null;
  order_index?: number | null;
  display_order?: number | null;
  name?: LocalizedTextValue;
  created_at?: string | null;
};

function toFiniteOrder(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveSortName(value: LocalizedTextValue | undefined): string {
  if (value == null) return "";
  return getLocalizedText(value).trim().toLowerCase();
}

/**
 * Strict comparator for categories/dishes.
 * Primary: order_index ?? display_order ?? 0
 * Tiebreakers (never shuffle): name → created_at → id
 */
export function compareMenuOrder(a: MenuOrderable, b: MenuOrderable): number {
  const orderA = toFiniteOrder(a.order_index) ?? toFiniteOrder(a.display_order) ?? 0;
  const orderB = toFiniteOrder(b.order_index) ?? toFiniteOrder(b.display_order) ?? 0;
  if (orderA !== orderB) return orderA - orderB;

  const nameA = resolveSortName(a.name);
  const nameB = resolveSortName(b.name);
  if (nameA !== nameB) return nameA.localeCompare(nameB);

  const createdA = typeof a.created_at === "string" ? a.created_at : "";
  const createdB = typeof b.created_at === "string" ? b.created_at : "";
  if (createdA !== createdB) return createdA.localeCompare(createdB);

  const idA = typeof a.id === "string" ? a.id : "";
  const idB = typeof b.id === "string" ? b.id : "";
  return idA.localeCompare(idB);
}

/** Immutable sort — safe for SSR and client render trees (no useEffect). */
export function sortByMenuOrder<T extends MenuOrderable>(records: readonly T[] | null | undefined): T[] {
  return [...(records ?? [])].sort(compareMenuOrder);
}
