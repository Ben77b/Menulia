"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * URL-backed dashboard UI state (tabs, sections). Survives remounts and hard refresh.
 */
export function useDashboardSearchParam(
  key: string,
  allowed: readonly string[] | null,
  fallback: string
): [string, (next: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo(() => {
    const raw = searchParams.get(key);
    if (!raw) return fallback;
    if (allowed && !allowed.includes(raw)) return fallback;
    return raw;
  }, [searchParams, key, allowed, fallback]);

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, key]
  );

  return [value, setValue];
}
