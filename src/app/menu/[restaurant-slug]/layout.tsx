import type { ReactNode } from "react";
import { getCachedPublicMenuSplashBySlug } from "@/lib/public-menu-cache";
import { PublicMenuRouteShell } from "@/components/public/public-menu-route-shell";

export const revalidate = 60;

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
  const slug = resolvedParams["restaurant-slug"];
  const splash = await getCachedPublicMenuSplashBySlug(slug);

  return <PublicMenuRouteShell splash={splash}>{children}</PublicMenuRouteShell>;
}
