"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, Check, Copy, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  buildTransferClaimUrl,
  cancelRestaurantTransfer,
  fetchPendingRestaurantTransfer,
  initiateRestaurantTransfer,
  type RestaurantTransferRecord,
} from "@/lib/restaurant-transfer";
import { useToast } from "@/components/ui/toast";

interface SettingsTransferPanelProps {
  restaurantId: string;
}

export function SettingsTransferPanel({ restaurantId }: SettingsTransferPanelProps) {
  const toast = useToast();
  const supabase = getSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<RestaurantTransferRecord | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const record = await fetchPendingRestaurantTransfer(supabase, restaurantId);
      setPending(record);
    } catch (err) {
      console.error("[transfer:loadPending]", err);
      setError(err instanceof Error ? err.message : "Failed to load transfer status.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, supabase]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  async function handleInitiate() {
    setSubmitting(true);
    setError(null);
    try {
      const created = await initiateRestaurantTransfer(supabase, restaurantId, recipientEmail);
      setPending(created);
      setRecipientEmail("");
      toast.success("Transfer initiated. Share the claim link with the new owner.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate transfer.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!pending) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelRestaurantTransfer(supabase, pending.id);
      setPending(null);
      toast.success("Transfer cancelled.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel transfer.";
      setError(message);
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  }

  async function handleCopyLink() {
    if (!pending) return;
    const url = buildTransferClaimUrl(pending.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Transfer link copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy link.");
    }
  }

  const claimUrl = pending ? buildTransferClaimUrl(pending.token) : "";

  return (
    <section className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <ArrowRightLeft className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-amber-950">Transfer Ownership</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Generate a secure link to transfer this restaurant to another Menulia account. Links
            expire after 7 days.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading transfer status…
        </div>
      ) : pending ? (
        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-sm font-medium text-emerald-950">
            Pending transfer to:{" "}
            <span className="font-semibold">{pending.recipient_email}</span>
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Transfer link
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                readOnly
                value={claimUrl}
                className="air-input min-h-11 flex-1 font-mono text-xs text-slate-700"
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 gap-2"
                onClick={() => void handleCopyLink()}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Expires {new Date(pending.expires_at).toLocaleString()}
          </p>

          <Button
            type="button"
            variant="outline"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={cancelling}
            onClick={() => void handleCancel()}
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Cancel Transfer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="transfer-recipient-email" className="air-label">
              New Owner&apos;s Email
            </label>
            <input
              id="transfer-recipient-email"
              type="email"
              autoComplete="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="newowner@restaurant.com"
              className="air-input"
            />
          </div>
          <Button
            type="button"
            disabled={submitting || !recipientEmail.trim()}
            className="min-h-11"
            onClick={() => void handleInitiate()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating…
              </>
            ) : (
              "Initiate Transfer"
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
