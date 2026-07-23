"use client";

import { Suspense, type ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";

/** Public menu shell — real menu UI only. */
export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <Suspense fallback={null}>
        <PublicMenuLayout {...props} />
      </Suspense>
    </PublicMenuFilterProvider>
  );
}
