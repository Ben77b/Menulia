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

export function buildUserProfile(user: User): UserProfile {
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

export async function syncUserProfileRecord(
  supabase: SupabaseClient,
  profile: UserProfile
): Promise<boolean> {
  const baseRecord = {
    id: profile.id,
    email: profile.email,
  };

  const { error: upsertError } = await supabase.from("profiles").upsert(baseRecord, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (!upsertError) {
    return true;
  }

  console.dir(upsertError, { depth: null });

  if (isMissingSchemaError(upsertError.code)) {
    return false;
  }

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profile.id)
    .maybeSingle();

  if (readError && !isMissingSchemaError(readError.code)) {
    console.dir(readError, { depth: null });
  }

  if (!existingProfile?.id) {
    const { error: insertError } = await supabase.from("profiles").insert(baseRecord);

    if (!insertError) {
      return true;
    }

    console.dir(insertError, { depth: null });

    if (isMissingSchemaError(insertError.code)) {
      return false;
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ email: profile.email })
    .eq("id", profile.id);

  if (!updateError) {
    return true;
  }

  console.dir(updateError, { depth: null });

  if (isMissingSchemaError(updateError.code)) {
    return false;
  }

  logAuthDiagnostic("profiles.sync", updateError ?? upsertError);
  return false;
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
