import type { SupabaseClient } from "@supabase/supabase-js";

export interface SecurityPreferences {
  two_factor_enabled: boolean;
}

export const DEFAULT_SECURITY_PREFERENCES: SecurityPreferences = {
  two_factor_enabled: false,
};

const EMAIL_VERIFICATION_BANNER =
  "Verification links sent to both your old and new email addresses. Please check both inboxes to complete the update.";

export { EMAIL_VERIFICATION_BANNER };

function isMissingSchemaError(code: string | undefined): boolean {
  return code === "42P01" || code === "42703" || code === "PGRST204";
}

export function normalizeSecurityPreferences(value: unknown): SecurityPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_SECURITY_PREFERENCES;
  }

  const record = value as Record<string, unknown>;
  return {
    two_factor_enabled: record.two_factor_enabled === true,
  };
}

export async function fetchSecurityPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<SecurityPreferences> {
  if (!userId) {
    return DEFAULT_SECURITY_PREFERENCES;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("security_preferences")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error.code)) {
        return DEFAULT_SECURITY_PREFERENCES;
      }
      console.warn("[auth:profiles.security_preferences]", error);
      return DEFAULT_SECURITY_PREFERENCES;
    }

    return normalizeSecurityPreferences(data?.security_preferences);
  } catch (error) {
    console.warn("[auth:profiles.security_preferences]", error);
    return DEFAULT_SECURITY_PREFERENCES;
  }
}

export async function saveSecurityPreferences(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  preferences: SecurityPreferences
): Promise<void> {
  if (!userId) return;

  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: email ?? "",
        security_preferences: preferences,
      },
      { onConflict: "id" }
    );

    if (error && !isMissingSchemaError(error.code)) {
      console.warn("[auth:profiles.security_preferences.save]", error);
    }
  } catch (error) {
    console.warn("[auth:profiles.security_preferences.save]", error);
  }
}
