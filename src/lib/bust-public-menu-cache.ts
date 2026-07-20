/**
 * Client-side helper to bust the public menu ISR/edge cache after dashboard mutations.
 * Fire-and-forget; never blocks the UX on revalidation failure.
 */
import { revalidatePublicMenu } from "@/app/actions/revalidate-public-menu";

export function bustPublicMenuCache(slug: string | null | undefined): void {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return;
  void revalidatePublicMenu(normalized).catch((error) => {
    console.error("[bustPublicMenuCache]", error);
  });
}
