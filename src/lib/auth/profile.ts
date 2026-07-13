import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ensureAuthSessionCommitted } from "./session";
import { logAuthDiagnostic } from "./messages";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "",
  email: "",
  displayName: "User",
};

export function buildUserProfile(user: User | null | undefined): UserProfile {
  if (!user?.id) {
    return DEFAULT_USER_PROFILE;
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.trim()
        : "";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: metadataName || user.email?.split("@")[0] || "User",
  };
}

function isMissingSchemaError(code: string | undefined): boolean {
  return code === "42P01" || code === "42703";
}

function isBenignProfileError(code: string | undefined, status?: number): boolean {
  if (isMissingSchemaError(code)) return true;
  if (code === "PGRST116") return true;
  if (status === 404) return true;
  return false;
}

export async function syncUserProfileRecord(
  supabase: SupabaseClient,
  profile: UserProfile
): Promise<boolean> {
  if (!profile?.id) {
    return false;
  }

  try {
    const baseRecord = {
      id: profile.id,
      email: profile.email ?? "",
    };

    const { error: upsertError } = await supabase.from("profiles").upsert(baseRecord, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (!upsertError) {
      return true;
    }

    if (isBenignProfileError(upsertError.code, upsertError.status)) {
      return false;
    }

    console.dir(upsertError, { depth: null });

    const { data: existingProfile, error: readError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profile.id)
      .maybeSingle();

    if (readError && !isBenignProfileError(readError.code, readError.status)) {
      console.dir(readError, { depth: null });
    }

    if (!existingProfile?.id) {
      const { error: insertError } = await supabase.from("profiles").insert(baseRecord);

      if (!insertError) {
        return true;
      }

      if (isBenignProfileError(insertError.code, insertError.status)) {
        return false;
      }

      console.dir(insertError, { depth: null });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ email: profile.email ?? "" })
      .eq("id", profile.id);

    if (!updateError) {
      return true;
    }

    if (isBenignProfileError(updateError.code, updateError.status)) {
      return false;
    }

    console.dir(updateError, { depth: null });
    logAuthDiagnostic("profiles.sync", updateError ?? upsertError);
    return false;
  } catch (error) {
    logAuthDiagnostic("profiles.sync", error);
    return false;
  }
}

export async function fetchRestaurantsForLogin(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    logAuthDiagnostic("restaurants.loginFetch", error);
    console.dir(error, { depth: null });
    return [];
  }

  return data ?? [];
}

export async function resolveLoginDestination(
  supabase: SupabaseClient = getSupabaseBrowserClient(),
  userId: string
): Promise<string> {
  const restaurants = await fetchRestaurantsForLogin(supabase, userId);

  if (restaurants.length > 0) {
    return `/dashboard/${restaurants[0].id}`;
  }

  return "/dashboard";
}

export async function completeAuthenticatedLogin(
  supabase: SupabaseClient = getSupabaseBrowserClient(),
  authenticatedUser?: User
): Promise<{ profile: UserProfile; destination: string }> {
  const session = await ensureAuthSessionCommitted(supabase, authenticatedUser);
  const user = authenticatedUser ?? session.user;

  if (!user?.id) {
    throw new Error("Your session could not be verified. Please try again.");
  }

  const profile = buildUserProfile(user);

  try {
    await syncUserProfileRecord(supabase, profile);
  } catch (profileError) {
    logAuthDiagnostic("login.profileSync", profileError);
    console.dir(profileError, { depth: null });
  }

  let destination = "/dashboard";

  try {
    destination = await resolveLoginDestination(supabase, user.id);
  } catch (destinationError) {
    logAuthDiagnostic("login.resolveDestination", destinationError);
    console.dir(destinationError, { depth: null });
  }

  return { profile, destination };
}
