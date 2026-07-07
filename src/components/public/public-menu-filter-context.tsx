"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { FILTERABLE_TAGS } from "@/lib/dietary-tags";

const FILTER_SEARCH_PARAM = "diet";
const FILTERABLE_TAG_SET = new Set<string>(FILTERABLE_TAGS);

interface PublicMenuFilterContextValue {
  activeFilters: Set<string>;
  toggleFilter: (tag: string) => void;
}

const PublicMenuFilterContext = createContext<PublicMenuFilterContextValue | null>(null);

function parseFilterTags(search: string): Set<string> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const tags = params
    .getAll(FILTER_SEARCH_PARAM)
    .filter((tag) => FILTERABLE_TAG_SET.has(tag));
  return new Set(tags);
}

function readInitialFiltersFromLocation(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return parseFilterTags(window.location.search);
}

function syncFiltersToLocation(filters: Set<string>) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.delete(FILTER_SEARCH_PARAM);
  filters.forEach((tag) => url.searchParams.append(FILTER_SEARCH_PARAM, tag));

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function PublicMenuFilterProviderInstant({ children }: { children: ReactNode }) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(readInitialFiltersFromLocation);

  useEffect(() => {
    const onPopState = () => {
      setActiveFilters(readInitialFiltersFromLocation());
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const toggleFilter = useCallback((tag: string) => {
    if (!FILTERABLE_TAG_SET.has(tag)) return;

    setActiveFilters((previous) => {
      const next = new Set(previous);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      syncFiltersToLocation(next);
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
  if (!syncToUrl) {
    return <PublicMenuFilterProviderLocal>{children}</PublicMenuFilterProviderLocal>;
  }

  return <PublicMenuFilterProviderInstant>{children}</PublicMenuFilterProviderInstant>;
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

export function usePublicMenuFilters(): PublicMenuFilterContextValue {
  const context = useContext(PublicMenuFilterContext);
  if (!context) {
    throw new Error("usePublicMenuFilters must be used within PublicMenuFilterProvider");
  }
  return context;
}
