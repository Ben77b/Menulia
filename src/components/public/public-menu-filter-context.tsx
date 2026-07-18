"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { dishTagLabel } from "@/lib/dietary-tags";

const FILTER_SEARCH_PARAM = "diet";

interface PublicMenuFilterContextValue {
  activeFilters: Set<string>;
  isMounted: boolean;
  toggleFilter: (tag: string) => void;
  clearFilters: () => void;
}

const PublicMenuFilterContext = createContext<PublicMenuFilterContextValue | null>(null);

function normalizeFilterIdentity(tag: string): string {
  return dishTagLabel(tag) || tag.trim();
}

function parseFilterTags(search: string): Set<string> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const tags = params
    .getAll(FILTER_SEARCH_PARAM)
    .map((tag) => normalizeFilterIdentity(tag))
    .filter(Boolean);
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
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    setActiveFilters(readInitialFiltersFromLocation());

    const onPopState = () => {
      setActiveFilters(readInitialFiltersFromLocation());
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isMounted]);

  const toggleFilter = useCallback(
    (tag: string) => {
      const identity = normalizeFilterIdentity(tag);
      if (!identity) return;

      setActiveFilters((previous) => {
        const next = new Set(previous);
        if (next.has(identity)) {
          next.delete(identity);
        } else {
          next.add(identity);
        }
        if (isMounted) {
          syncFiltersToLocation(next);
        }
        return next;
      });
    },
    [isMounted]
  );

  const clearFilters = useCallback(() => {
    setActiveFilters(new Set());
    if (isMounted) {
      syncFiltersToLocation(new Set());
    }
  }, [isMounted]);

  return (
    <PublicMenuFilterContext.Provider
      value={{ activeFilters, isMounted, toggleFilter, clearFilters }}
    >
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
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleFilter = useCallback((tag: string) => {
    const identity = normalizeFilterIdentity(tag);
    if (!identity) return;
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(identity)) {
        next.delete(identity);
      } else {
        next.add(identity);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  return (
    <PublicMenuFilterContext.Provider
      value={{ activeFilters, isMounted, toggleFilter, clearFilters }}
    >
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
