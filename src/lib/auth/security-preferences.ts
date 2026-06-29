import type { SupabaseClient } from "@supabase/supabase-js";

export interface SecurityPreferences {
  two_factor_enabled: boolean;
}

export const DEFAULT_SECURITY_PREFERENCES: SecurityPreferences = {
  two_factor_enabled: false,
};

function isMissingSchemaError(code: string | undefined): boolean {
  return code === "42P01" || code === "42703";
}

export function normalizeSecurityPreferences(
  value: unknown
): SecurityPreferences {
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
  const { data, error } = await supabase
    .from("profiles")
    .select("security_preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error.code)) {
      return DEFAULT_SECURITY_PREFERENCES;
    }
    throw error;
  }

  return normalizeSecurityPreferences(data?.security_preferences);
}

export async function saveSecurityPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: SecurityPreferences
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ security_preferences: preferences })
    .eq("id", userId);

  if (error) {
    if (isMissingSchemaError(error.code)) {
      return;
    }
    throw error;
  }
}
