import { createClient as createSupabaseJsClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export function createAnonClient(): SupabaseClient {
  return createSupabaseJsClient(supabaseUrl, supabaseAnonKey);
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createAnonClient();
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

export const supabase: SupabaseClient =
  typeof window === "undefined" ? createAnonClient() : getSupabaseBrowserClient();
