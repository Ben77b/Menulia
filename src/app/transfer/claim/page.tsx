"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { PublicLandingShell } from "@/components/marketing/public-landing-shell";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { queueDashboardFlashToast } from "@/lib/restaurant-transfer";

interface TransferPreview {
  valid: boolean;
  expired: boolean;
  restaurantName: string | null;
  recipientEmail: string | null;
}

function ClaimTransferContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const returnPath = token
    ? `/transfer/claim?token=${encodeURIComponent(token)}`
    : "/transfer/claim";
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(returnPath)}`;

  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsLoggedIn(Boolean(user));
      setUserEmail(user?.email ?? null);
    }

    void loadAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setPreview({ valid: false, expired: true, restaurantName: null, recipientEmail: null });
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setLookupError(null);
      try {
        const response = await fetch(
          `/api/transfer/lookup?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as TransferPreview & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load transfer.");
        }

        if (!cancelled) {
          setPreview(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setLookupError(
            error instanceof Error ? error.message : "Unable to load transfer details."
          );
          setPreview({ valid: false, expired: true, restaurantName: null, recipientEmail: null });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = useCallback(async () => {
    if (!token || !preview?.valid) return;

    setAccepting(true);
    setAcceptError(null);

    try {
      const response = await fetch("/api/transfer/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json()) as {
        restaurantId?: string;
        error?: string;
      };

      if (!response.ok || !payload.restaurantId) {
        throw new Error(payload.error ?? "Unable to accept transfer.");
      }

      queueDashboardFlashToast("Ownership transfer accepted. Welcome to your new dashboard!");
      window.location.assign(`/dashboard/${payload.restaurantId}`);
    } catch (error) {
      setAcceptError(
        error instanceof Error ? error.message : "Unable to accept transfer."
      );
    } finally {
      setAccepting(false);
    }
  }, [preview?.valid, token]);

  const emailMatchesInvite =
    preview?.recipientEmail &&
    userEmail &&
    preview.recipientEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  if (loading) {
    return (
      <div className="air-card w-full max-w-lg air-card-pad text-center">
        <LoadingSpinner label="Loading transfer invitation…" />
      </div>
    );
  }

  if (!preview?.valid || preview.expired) {
    return (
      <div className="air-card w-full max-w-lg air-card-pad text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transfer unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {lookupError ?? "This transfer link has expired or is invalid."}
        </p>
        <Button asChild className="mt-8" variant="outline">
          <Link href="/">Return to Menulia</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="air-card w-full max-w-lg air-card-pad">
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <ArrowRightLeft className="h-7 w-7" />
        </div>
      </div>

      <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
        Restaurant ownership transfer
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
        You have been invited to take ownership of{" "}
        <span className="font-semibold text-slate-900">{preview.restaurantName}</span>.
      </p>

      {preview.recipientEmail ? (
        <p className="mt-2 text-center text-xs text-slate-500">
          Invited account: {preview.recipientEmail}
        </p>
      ) : null}

      {!isLoggedIn ? (
        <div className="mt-8 space-y-4">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Please sign up or log in to your Menulia account to accept this transfer.
          </p>
          <Button asChild className="w-full" size="lg">
            <Link href={loginHref}>Log in to accept</Link>
          </Button>
          <Button asChild className="w-full" size="lg" variant="outline">
            <Link href={signupHref}>Create a Menulia account</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {!emailMatchesInvite ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You are signed in as <strong>{userEmail}</strong>, but this transfer was sent to{" "}
              <strong>{preview.recipientEmail}</strong>. Sign in with the invited email to continue.
            </p>
          ) : null}

          {acceptError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {acceptError}
            </p>
          ) : null}

          <Button
            className="w-full gap-2"
            size="lg"
            disabled={accepting || !emailMatchesInvite}
            onClick={() => void handleAccept()}
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Accepting transfer…
              </>
            ) : (
              "Accept Ownership Transfer & Access Dashboard"
            )}
          </Button>

          {!emailMatchesInvite ? (
            <Button asChild className="w-full" variant="outline">
              <Link href={loginHref}>Switch account</Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ClaimTransferPage() {
  return (
    <PublicLandingShell>
      <Suspense fallback={<LoadingSpinner label="Loading transfer invitation…" />}>
        <ClaimTransferContent />
      </Suspense>
    </PublicLandingShell>
  );
}
