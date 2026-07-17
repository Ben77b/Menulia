import type { SupabaseClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site-url";
import { logSupabaseFailure, formatSupabaseError } from "@/lib/auth/errors";

export interface RestaurantTransferRecord {
  id: string;
  restaurant_id: string;
  token: string;
  recipient_email: string;
  expires_at: string;
  created_at: string;
}

export interface RestaurantTransferPreview {
  restaurantName: string;
  recipientEmail: string;
  expiresAt: string;
  isValid: boolean;
}

export function buildTransferClaimUrl(token: string): string {
  return `${getSiteUrl()}/transfer/claim?token=${encodeURIComponent(token)}`;
}

export function isTransferExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function fetchPendingRestaurantTransfer(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<RestaurantTransferRecord | null> {
  const { data, error } = await supabase
    .from("restaurant_transfers")
    .select("id, restaurant_id, token, recipient_email, expires_at, created_at")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) {
    logSupabaseFailure("transfer.fetchPending", error);
    throw error;
  }

  if (!data) return null;

  if (isTransferExpired(data.expires_at)) {
    await supabase.from("restaurant_transfers").delete().eq("id", data.id);
    return null;
  }

  return data as RestaurantTransferRecord;
}

export async function initiateRestaurantTransfer(
  supabase: SupabaseClient,
  restaurantId: string,
  recipientEmail: string
): Promise<RestaurantTransferRecord> {
  const normalizedEmail = recipientEmail.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("invalid_email");
  }

  const { data, error } = await supabase.rpc("initiate_restaurant_transfer", {
    p_restaurant_id: restaurantId,
    p_recipient_email: normalizedEmail,
  });

  if (error) {
    logSupabaseFailure("transfer.initiate", error);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Failed to initiate transfer.");
  }

  return row as RestaurantTransferRecord;
}

export async function cancelRestaurantTransfer(
  supabase: SupabaseClient,
  transferId: string
): Promise<void> {
  const { error } = await supabase.from("restaurant_transfers").delete().eq("id", transferId);

  if (error) {
    logSupabaseFailure("transfer.cancel", error);
    throw error;
  }
}

export async function lookupRestaurantTransferPreview(
  supabase: SupabaseClient,
  token: string
): Promise<RestaurantTransferPreview | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase.rpc("get_restaurant_transfer_preview", {
    p_token: trimmed,
  });

  if (error) {
    logSupabaseFailure("transfer.lookup", error);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    restaurantName: String(row.restaurant_name ?? ""),
    recipientEmail: String(row.recipient_email ?? ""),
    expiresAt: String(row.expires_at ?? ""),
    isValid: Boolean(row.is_valid),
  };
}

export async function claimRestaurantTransfer(
  supabase: SupabaseClient,
  token: string
): Promise<string> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("invalid_or_expired_token");
  }

  const { data, error } = await supabase.rpc("claim_restaurant_transfer", {
    p_token: trimmed,
  });

  if (error) {
    logSupabaseFailure("transfer.claim", error);
    throw error;
  }

  if (!data) {
    throw new Error("invalid_or_expired_token");
  }

  return String(data);
}

export function transferInitiateErrorMessage(error: unknown): string {
  const message = formatSupabaseError(error);

  if (/not_authenticated/i.test(message)) {
    return "You must be signed in to initiate a transfer.";
  }

  if (/not_owner/i.test(message)) {
    return "You do not have permission to transfer this restaurant.";
  }

  if (/same_email/i.test(message)) {
    return "The new owner must use a different email address.";
  }

  if (/invalid_email/i.test(message)) {
    return "Enter a valid email address for the new owner.";
  }

  if (/42703|does not exist|PGRST202/i.test(message)) {
    return "Transfer setup is incomplete. Apply the latest Supabase migrations for restaurant_transfers.";
  }

  return message || "Failed to initiate transfer.";
}

export function transferClaimErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (/invalid_or_expired_token/i.test(message)) {
    return "This transfer link has expired or is invalid.";
  }

  if (/email_mismatch/i.test(message)) {
    return "This transfer was sent to a different email address. Sign in with the invited account.";
  }

  if (/not_authenticated/i.test(message)) {
    return "Please sign in to accept this transfer.";
  }

  return message || "Unable to complete the ownership transfer.";
}

export function queueDashboardFlashToast(message: string, variant: "success" | "error" = "success") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("menulia:flash-toast", JSON.stringify({ message, variant }));
}
