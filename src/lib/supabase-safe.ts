/**
 * Shared logging + safe fallbacks for Supabase query failures.
 * Never throw from these helpers — callers get null/[] instead of red screens.
 */

export function logSupabaseAuditError(context: string, error: unknown): void {
  console.error("[Supabase Audit Error]:", context, error);
}

export async function withSupabaseFallback<T>(
  context: string,
  run: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    logSupabaseAuditError(context, error);
    return fallback;
  }
}
