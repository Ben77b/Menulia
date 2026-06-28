const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRestaurantUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export interface RestaurantIdLookup {
  id: string;
  slug?: string;
}

export function resolveRestaurantDbId(
  restaurants: RestaurantIdLookup[],
  options?: { routeParam?: string; preferredId?: string | null }
): string | null {
  const { routeParam, preferredId } = options ?? {};

  const findMatch = (value: string) => {
    const byId = restaurants.find((entry) => entry.id === value);
    if (byId) return byId.id;

    const bySlug = restaurants.find((entry) => entry.slug === value);
    if (bySlug) return bySlug.id;

    return null;
  };

  if (routeParam) {
    const matched = findMatch(routeParam);
    if (matched) return matched;
    if (isRestaurantUuid(routeParam)) return routeParam;
  }

  if (preferredId) {
    const matched = findMatch(preferredId);
    if (matched) return matched;
    if (isRestaurantUuid(preferredId)) return preferredId;
  }

  const fallback = restaurants[0]?.id ?? null;
  return fallback && isRestaurantUuid(fallback) ? fallback : null;
}
