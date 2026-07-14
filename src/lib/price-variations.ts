export interface PriceVariation {
  label: string;
  price: number;
}

export function parsePriceVariationsFromDb(value: unknown): PriceVariation[] {
  if (value == null) return [];

  let parsed: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const label = typeof row.label === "string" ? row.label.trim() : "";
      const price =
        typeof row.price === "number"
          ? row.price
          : parseFloat(String(row.price ?? ""));
      if (!label || Number.isNaN(price)) return null;
      return { label, price };
    })
    .filter((entry): entry is PriceVariation => entry !== null);
}

export function serializePriceVariationsForDb(
  variations: PriceVariation[] | null | undefined
): PriceVariation[] | null {
  if (!variations?.length) return null;
  const normalized = variations
    .map((entry) => ({
      label: entry.label.trim(),
      price: Number(entry.price),
    }))
    .filter((entry) => entry.label.length > 0 && !Number.isNaN(entry.price));

  return normalized.length > 0 ? normalized : null;
}

export function hasPriceVariations(
  variations: PriceVariation[] | null | undefined
): variations is PriceVariation[] {
  return Array.isArray(variations) && variations.length > 0;
}
