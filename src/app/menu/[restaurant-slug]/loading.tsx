import { PublicMenuSplashScreen } from "@/components/public/public-menu-splash-screen";

/**
 * Instant fallback while `/menu/[restaurant-slug]` streams.
 * Theme + logo come from the parent layout splash context (no Base64 in this file).
 */
export default function PublicMenuLoading() {
  return <PublicMenuSplashScreen />;
}
