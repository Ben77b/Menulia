"use client";

import type { ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";

/** Public menu shell — render the menu directly (no Suspense blank frame). */
export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <PublicMenuLayout {...props} />
    </PublicMenuFilterProvider>
  );
}
