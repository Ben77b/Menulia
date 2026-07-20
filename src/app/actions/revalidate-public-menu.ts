"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Bust ISR / Data Cache for a restaurant's public menu after owner mutations.
 * Safe to call from client components (server action stub).
 */
export async function revalidatePublicMenu(slug: string): Promise<void> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return;

  revalidatePath(`/menu/${normalized}`, "page");
  revalidatePath(`/menu/${normalized}`, "layout");
  revalidateTag("public-menu");
  revalidateTag(`public-menu:${normalized}`);
}
