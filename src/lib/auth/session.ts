import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { fetchAllRestaurants } from "@/lib/data";

const SESSION_POLL_INTERVAL_MS = 150;
const SESSION_MAX_WAIT_MS = 10000;
const PROFILE_POLL_INTERVAL_MS = 200;
const PROFILE_MAX_WAIT_MS = 6000;

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
  user: User
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < PROFILE_MAX_WAIT_MS) {
    const { data: existingProfile, error: readError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) {
      if (readError.code === "42P01" || readError.code === "42703") {
        return;
      }
      console.error("[auth.ensureUserProfileReady:read]", {
        message: readError.message,
        details: readError.details,
        code: readError.code,
      });
    }

    if (existingProfile?.id) {
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? "",
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

    if (!upsertError) {
      return;
    }

    if (upsertError.code === "42P01" || upsertError.code === "42703") {
      return;
    }

    console.error("[auth.ensureUserProfileReady:upsert]", {
      message: upsertError.message,
      details: upsertError.details,
      code: upsertError.code,
    });

    await delay(PROFILE_POLL_INTERVAL_MS);
  }
}

export async function resolvePostAuthDashboardRoute(
  supabase: SupabaseClient = getSupabaseBrowserClient()
): Promise<string> {
  const session = await waitForAuthenticatedSession(supabase);
  await ensureUserProfileReady(supabase, session.user);

  const restaurants = await fetchAllRestaurants(session.user.id);

  if (restaurants.length > 0) {
    return `/dashboard/${restaurants[0].id}`;
  }

  return "/dashboard";
}
