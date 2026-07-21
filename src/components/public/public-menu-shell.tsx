"use client";

import type { ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";

/** Public menu shell — render the real menu immediately (no splash overlay). */
export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <PublicMenuLayout {...props} />
    </PublicMenuFilterProvider>
  );
}
