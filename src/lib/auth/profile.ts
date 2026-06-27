import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { fetchAllRestaurants } from "@/lib/data";
import { logAuthDiagnostic } from "./messages";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export function buildUserProfile(user: User): UserProfile {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: metadataName || user.email?.split("@")[0] || "User",
  };
}

export async function syncUserProfileRecord(
  supabase: SupabaseClient,
  profile: UserProfile
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: profile.id,
      email: profile.email,
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (!error) {
    return;
  }

  if (error.code === "42P01" || error.code === "42703") {
    return;
  }

  logAuthDiagnostic("profiles.sync", error);
}

export async function resolveLoginDestination(
  supabase: SupabaseClient = getSupabaseBrowserClient(),
  userId: string
): Promise<string> {
  const restaurants = await fetchAllRestaurants(userId);

  if (restaurants.length > 0) {
    return `/dashboard/${restaurants[0].id}`;
  }

  return "/dashboard";
}

export async function completeAuthenticatedLogin(
  supabase: SupabaseClient = getSupabaseBrowserClient()
): Promise<{ profile: UserProfile; destination: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (userError) {
      logAuthDiagnostic("login.getUser", userError);
    }
    throw new Error("Your session could not be verified. Please try again.");
  }

  const profile = buildUserProfile(user);
  await syncUserProfileRecord(supabase, profile);

  const destination = await resolveLoginDestination(supabase, user.id);

  return { profile, destination };
}
