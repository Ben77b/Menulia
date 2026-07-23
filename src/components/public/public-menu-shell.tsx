"use client";

import type { ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";
import PublicMenuLoadingOverlay from "@/components/menu/PublicMenuLoadingOverlay";

/** Public menu shell — loading overlay is the first paint, every mount. */
export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <PublicMenuLoadingOverlay
        restaurantName={props.restaurantName}
        restaurantSlug={props.restaurantSlug}
        logo={props.logo}
        backgroundColor={props.theme?.menuBackground}
        accentColor={
          props.theme?.categoryAccentColor || props.theme?.logoAreaText
        }
      />
      <PublicMenuLayout {...props} />
    </PublicMenuFilterProvider>
  );
}
