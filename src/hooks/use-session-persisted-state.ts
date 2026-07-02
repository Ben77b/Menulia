"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Persists component state in sessionStorage so drafts survive remounts
 * (e.g. brief auth/layout loading flashes).
 */
export function useSessionPersistedState<T>(
  storageKey: string | null,
  initial: T,
  normalize: (value: unknown) => T = (value) => value as T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined" || !storageKey) return initial;
    try {
      const item = sessionStorage.getItem(storageKey);
      return item ? normalize(JSON.parse(item)) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (!storageKey) {
      setState(initial);
      return;
    }

    try {
      const item = sessionStorage.getItem(storageKey);
      setState(item ? normalize(JSON.parse(item)) : initial);
    } catch {
      setState(initial);
    }
  }, [storageKey, initial, normalize]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore quota / private mode errors
    }
  }, [storageKey, state]);

  return [state, setState];
}
