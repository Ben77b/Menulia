import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { buildUserProfile, syncUserProfileRecord } from "./profile";

const SESSION_POLL_INTERVAL_MS = 150;
const SESSION_MAX_WAIT_MS = 10000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForAuthenticatedSession(
  supabase: SupabaseClient = getSupabaseBrowserClient(),
  maxWaitMs = SESSION_MAX_WAIT_MS
): Promise<Session> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < maxWaitMs) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (session?.user?.id && session.access_token) {
      return session;
    }

    await delay(SESSION_POLL_INTERVAL_MS);
  }

  throw new Error("Your session could not be established. Please try logging in again.");
}

export async function ensureUserProfileReady(
  supabase: SupabaseClient,
  user: Parameters<typeof buildUserProfile>[0]
): Promise<void> {
  const profile = buildUserProfile(user);
  await syncUserProfileRecord(supabase, profile);
}

export async function resolvePostAuthDashboardRoute(
  supabase: SupabaseClient = getSupabaseBrowserClient()
): Promise<string> {
  const session = await waitForAuthenticatedSession(supabase);
  await ensureUserProfileReady(supabase, session.user);

  const { resolveLoginDestination } = await import("./profile");
  return resolveLoginDestination(supabase, session.user.id);
}
