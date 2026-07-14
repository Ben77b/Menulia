"use client";

import { useEffect, useState } from "react";

export interface TouchLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Disable inline row editing; use drawer/sheet instead */
  touchOptimized: boolean;
  /** Side-by-side categories + canvas (lg+) */
  useTwoColumn: boolean;
  /** Floating categories trigger (tablet portrait band) */
  showTabletCategoryTrigger: boolean;
}

const DEFAULT_STATE: TouchLayoutState = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  touchOptimized: false,
  useTwoColumn: true,
  showTabletCategoryTrigger: false,
};

function resolveTouchLayout(): TouchLayoutState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  const width = window.innerWidth;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const touchOptimized = coarsePointer || noHover || width < 1024;

  return {
    isMobile,
    isTablet,
    isDesktop,
    touchOptimized,
    useTwoColumn: width >= 1024,
    showTabletCategoryTrigger: isTablet,
  };
}

export function useTouchLayout(): TouchLayoutState {
  const [state, setState] = useState<TouchLayoutState>(DEFAULT_STATE);

  useEffect(() => {
    function update() {
      setState(resolveTouchLayout());
    }

    update();
    window.addEventListener("resize", update);

    const coarseMq = window.matchMedia("(pointer: coarse)");
    const hoverMq = window.matchMedia("(hover: none)");
    coarseMq.addEventListener("change", update);
    hoverMq.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      coarseMq.removeEventListener("change", update);
      hoverMq.removeEventListener("change", update);
    };
  }, []);

  return state;
}
