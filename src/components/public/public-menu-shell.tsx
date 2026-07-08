"use client";

import type { ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";
import { PublicMenuClientSplashGate } from "@/components/public/public-menu-client-splash-gate";

export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <PublicMenuClientSplashGate>
        <PublicMenuLayout {...props} />
      </PublicMenuClientSplashGate>
    </PublicMenuFilterProvider>
  );
}
