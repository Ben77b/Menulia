import type { ReactNode } from "react";
import {
  DEFAULT_PUBLIC_MENU_SPLASH,
  getPublicMenuSplashBySlug,
} from "@/lib/public-menu-cache";
import { PublicMenuRouteShell } from "@/components/public/public-menu-route-shell";
import { normalizeImageUrl } from "@/lib/public-menu-utils";
import { DEFAULT_MENU_THEME } from "@/lib/theme-colors";

export const revalidate = 86400;

export default async function PublicMenuLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ "restaurant-slug": string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams?.["restaurant-slug"] ?? "";

  let splash = DEFAULT_PUBLIC_MENU_SPLASH;
  try {
    splash = (await getPublicMenuSplashBySlug(slug)) ?? DEFAULT_PUBLIC_MENU_SPLASH;
  } catch (error) {
    console.error("[public-menu.layout.splash]", error);
  }

  // Prefer a light loading frame — pure black splash looks like a crash.
  const rawBg = splash?.backgroundColor || DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor;
  const backgroundColor =
    typeof rawBg === "string" && rawBg.trim().toLowerCase() === "#000000"
      ? DEFAULT_MENU_THEME.mainContentBackgroundColor
      : rawBg || DEFAULT_MENU_THEME.mainContentBackgroundColor;

  return (
    <PublicMenuRouteShell
      splash={{
        restaurantName: splash?.restaurantName || "",
        logo: normalizeImageUrl(splash?.logo ?? null),
        backgroundColor,
        accentColor: splash?.accentColor || DEFAULT_PUBLIC_MENU_SPLASH.accentColor,
      }}
    >
      {children}
    </PublicMenuRouteShell>
  );
}
