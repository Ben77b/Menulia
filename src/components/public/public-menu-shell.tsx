"use client";

import type { ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";
import { PublicMenuIntroOverlay } from "@/components/public/public-menu-intro-overlay";

/** Public menu shell — intro overlay always paints, even when loading.tsx is skipped. */
export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <PublicMenuIntroOverlay
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
