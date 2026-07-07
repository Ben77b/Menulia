"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FILTERABLE_TAGS } from "@/lib/dietary-tags";

const FILTER_SEARCH_PARAM = "diet";
const FILTERABLE_TAG_SET = new Set<string>(FILTERABLE_TAGS);

interface PublicMenuFilterContextValue {
  activeFilters: Set<string>;
  toggleFilter: (tag: string) => void;
}

const PublicMenuFilterContext = createContext<PublicMenuFilterContextValue | null>(null);

function parseFilterTags(searchParams: URLSearchParams): Set<string> {
  const tags = searchParams
    .getAll(FILTER_SEARCH_PARAM)
    .filter((tag) => FILTERABLE_TAG_SET.has(tag));
  return new Set(tags);
}

function PublicMenuFilterProviderUrl({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilters = useMemo(() => parseFilterTags(searchParams), [searchParams]);

  const toggleFilter = useCallback(
    (tag: string) => {
      if (!FILTERABLE_TAG_SET.has(tag)) return;

      const params = new URLSearchParams(searchParams.toString());
      const next = new Set(parseFilterTags(params));

      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }

      params.delete(FILTER_SEARCH_PARAM);
      next.forEach((value) => params.append(FILTER_SEARCH_PARAM, value));

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <PublicMenuFilterContext.Provider value={{ activeFilters, toggleFilter }}>
      {children}
    </PublicMenuFilterContext.Provider>
  );
}

function PublicMenuFilterProviderLocal({ children }: { children: ReactNode }) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set());

  const toggleFilter = useCallback((tag: string) => {
    if (!FILTERABLE_TAG_SET.has(tag)) return;
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  return (
    <PublicMenuFilterContext.Provider value={{ activeFilters, toggleFilter }}>
      {children}
    </PublicMenuFilterContext.Provider>
  );
}

export function PublicMenuFilterProvider({
  children,
  syncToUrl = true,
}: {
  children: ReactNode;
  syncToUrl?: boolean;
}) {
  if (syncToUrl) {
    return <PublicMenuFilterProviderUrl>{children}</PublicMenuFilterProviderUrl>;
  }

  return <PublicMenuFilterProviderLocal>{children}</PublicMenuFilterProviderLocal>;
}

export function usePublicMenuFilters(): PublicMenuFilterContextValue {
  const context = useContext(PublicMenuFilterContext);
  if (!context) {
    throw new Error("usePublicMenuFilters must be used within PublicMenuFilterProvider");
  }
  return context;
}
