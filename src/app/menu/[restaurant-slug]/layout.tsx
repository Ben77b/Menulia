import type { ReactNode } from "react";
import {
  DEFAULT_PUBLIC_MENU_SPLASH,
  getPublicMenuSplashBySlug,
} from "@/lib/public-menu-cache";
import { PublicMenuRouteShell } from "@/components/public/public-menu-route-shell";

export const revalidate = 86400;

export function headers() {
  return {
    "Content-Security-Policy": "frame-ancestors *",
  };
}

export default async function PublicMenuLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ "restaurant-slug": string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams["restaurant-slug"] ?? "";

  let splash = DEFAULT_PUBLIC_MENU_SPLASH;
  try {
    splash = (await getPublicMenuSplashBySlug(slug)) ?? DEFAULT_PUBLIC_MENU_SPLASH;
  } catch (error) {
    console.error("[public-menu.layout.splash]", error);
  }

  return (
    <PublicMenuRouteShell
      splash={{
        restaurantName: splash.restaurantName || "",
        logo: splash.logo ?? null,
        backgroundColor: splash.backgroundColor || DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor,
        accentColor: splash.accentColor || DEFAULT_PUBLIC_MENU_SPLASH.accentColor,
      }}
    >
      {children}
    </PublicMenuRouteShell>
  );
}
