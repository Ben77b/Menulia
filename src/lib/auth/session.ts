import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { buildUserProfile, syncUserProfileRecord } from "./profile";
import { logAuthDiagnostic } from "./messages";

const SESSION_POLL_INTERVAL_MS = 150;
const SESSION_MAX_WAIT_MS = 10000;
const SESSION_COMMIT_SETTLE_MS = 250;

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
      logAuthDiagnostic("session.wait", error);
      throw error;
    }

    if (session?.user?.id && session.access_token) {
      return session;
    }

    await delay(SESSION_POLL_INTERVAL_MS);
  }

  throw new Error("Your session could not be established. Please try logging in again.");
}

export async function ensureAuthSessionCommitted(
  supabase: SupabaseClient,
  authenticatedUser?: User
): Promise<Session> {
  const session = await waitForAuthenticatedSession(supabase);

  if (authenticatedUser && session.user.id !== authenticatedUser.id) {
    logAuthDiagnostic("session.commit", {
      message: "Session user id does not match signed-in user.",
      expected: authenticatedUser.id,
      received: session.user.id,
    });
    throw new Error("Your session could not be verified. Please try again.");
  }

  await delay(SESSION_COMMIT_SETTLE_MS);

  const {
    data: { session: recheckedSession },
    error: recheckError,
  } = await supabase.auth.getSession();

  if (recheckError) {
    logAuthDiagnostic("session.recheck", recheckError);
    throw recheckError;
  }

  if (!recheckedSession?.user?.id || !recheckedSession.access_token) {
    throw new Error("Your session could not be established. Please try logging in again.");
  }

  return recheckedSession;
}

export async function ensureUserProfileReady(
  supabase: SupabaseClient,
  user: Parameters<typeof buildUserProfile>[0]
): Promise<void> {
  try {
    const profile = buildUserProfile(user);
    await syncUserProfileRecord(supabase, profile);
  } catch (error) {
    logAuthDiagnostic("profiles.sync", error);
  }
}

export async function resolvePostAuthDashboardRoute(
  supabase: SupabaseClient = getSupabaseBrowserClient()
): Promise<string> {
  const session = await waitForAuthenticatedSession(supabase);
  await ensureUserProfileReady(supabase, session.user);

  const { resolveLoginDestination } = await import("./profile");
  return resolveLoginDestination(supabase, session.user.id);
}
