import type { SupabaseClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site-url";
import {
  logSupabaseFailure,
} from "@/lib/auth/errors";

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

export const TRANSFER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function buildTransferExpiresAtIso(fromMs: number = Date.now()): string {
  return new Date(fromMs + TRANSFER_TTL_MS).toISOString();
}

export function parseTransferTimestamp(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveTransferExpiresAt(expiresAt: unknown, createdAt: unknown): string {
  const parsedExpiry = parseTransferTimestamp(expiresAt);
  if (parsedExpiry) {
    return parsedExpiry.toISOString();
  }

  const parsedCreated = parseTransferTimestamp(createdAt);
  if (parsedCreated) {
    return new Date(parsedCreated.getTime() + TRANSFER_TTL_MS).toISOString();
  }

  return buildTransferExpiresAtIso();
}

export function formatTransferExpiryLabel(expiresAt: unknown, createdAt: unknown): string {
  const resolved = resolveTransferExpiresAt(expiresAt, createdAt);
  const parsed = parseTransferTimestamp(resolved);
  if (!parsed) return "unknown date";

  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function readRowString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

export function normalizeRestaurantTransferRecord(
  row: Record<string, unknown>,
  options?: {
    fallbackRecipientEmail?: string;
    fallbackToken?: string;
    fallbackRestaurantId?: string;
  }
): RestaurantTransferRecord {
  const createdAt =
    readRowString(row, "created_at", "createdAt") || new Date().toISOString();
  const recipientEmail =
    readRowString(row, "recipient_email", "recipientEmail", "recipient") ||
    options?.fallbackRecipientEmail?.trim().toLowerCase() ||
    "";
  const token =
    readRowString(row, "token", "tokenString", "transfer_token") ||
    options?.fallbackToken?.trim() ||
    "";

  return {
    id: readRowString(row, "id"),
    restaurant_id:
      readRowString(row, "restaurant_id", "restaurantId") ||
      options?.fallbackRestaurantId ||
      "",
    token,
    recipient_email: recipientEmail,
    created_at: createdAt,
    expires_at: resolveTransferExpiresAt(row.expires_at ?? row.expiresAt, createdAt),
  };
}

export function buildTransferClaimUrl(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    return `${getSiteUrl()}/transfer/claim`;
  }

  return `${getSiteUrl()}/transfer/claim?token=${encodeURIComponent(trimmed)}`;
}

export function isTransferExpired(expiresAt: string, createdAt?: string): boolean {
  const parsed = parseTransferTimestamp(resolveTransferExpiresAt(expiresAt, createdAt));
  if (!parsed) return true;
  return parsed.getTime() <= Date.now();
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

  const record = normalizeRestaurantTransferRecord(data as Record<string, unknown>);

  if (isTransferExpired(record.expires_at, record.created_at)) {
    await supabase.from("restaurant_transfers").delete().eq("id", record.id);
    return null;
  }

  return record;
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
    logSupabaseFailure("transfer.lookup.rpc", error);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return mapTransferPreviewRow(row);
}

type TransferPreviewRow = {
  restaurant_name?: unknown;
  recipient_email?: unknown;
  expires_at?: unknown;
  is_valid?: unknown;
};

type TransferJoinRow = {
  recipient_email?: unknown;
  expires_at?: unknown;
  created_at?: unknown;
  restaurants?: { name?: unknown } | { name?: unknown }[] | null;
};

function mapTransferPreviewRow(row: TransferPreviewRow): RestaurantTransferPreview {
  const expiresAt = resolveTransferExpiresAt(row.expires_at, null);
  return {
    restaurantName: String(row.restaurant_name ?? ""),
    recipientEmail: String(row.recipient_email ?? ""),
    expiresAt,
    isValid:
      row.is_valid !== undefined && row.is_valid !== null
        ? Boolean(row.is_valid)
        : !isTransferExpired(expiresAt),
  };
}

export async function lookupRestaurantTransferByToken(
  supabase: SupabaseClient,
  token: string
): Promise<RestaurantTransferPreview | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("restaurant_transfers")
    .select("recipient_email, expires_at, created_at, restaurants(name)")
    .eq("token", trimmed)
    .maybeSingle();

  if (error) {
    logSupabaseFailure("transfer.lookup.direct", error);
    throw error;
  }

  if (!data) return null;

  const row = data as TransferJoinRow;
  const restaurant = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
  const expiresAt = resolveTransferExpiresAt(row.expires_at, row.created_at);

  return {
    restaurantName: String(restaurant?.name ?? ""),
    recipientEmail: String(row.recipient_email ?? ""),
    expiresAt,
    isValid: !isTransferExpired(expiresAt, String(row.created_at ?? "")),
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
