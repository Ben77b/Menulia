import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceRoleClient: SupabaseClient | null = null;

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleClient) {
    serviceRoleClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceRoleClient;
}
