"use client";

import type { ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";
import PublicMenuLoadingOverlay from "@/components/menu/PublicMenuLoadingOverlay";

/** Public menu shell — loading overlay is the first paint, every mount. */
export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  const headerBackgroundColor =
    props.theme?.logoAreaBg || props.theme?.headerBackgroundColor;
  const headerTextColor =
    props.theme?.logoAreaText || props.theme?.categoryAccentColor;

  return (
    <PublicMenuFilterProvider>
      <PublicMenuLoadingOverlay
        restaurantName={props.restaurantName}
        restaurantSlug={props.restaurantSlug}
        logo={props.logo}
        headerBackgroundColor={headerBackgroundColor}
        headerTextColor={headerTextColor}
      />
      <PublicMenuLayout {...props} />
    </PublicMenuFilterProvider>
  );
}
