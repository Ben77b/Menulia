"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { completeAuthenticatedLogin } from "@/lib/auth/profile";
import { logAuthDiagnostic, toFriendlyAuthError } from "@/lib/auth/messages";

export function ResetPasswordClient() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifySession() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?next=/dashboard/reset-password");
          return;
        }
      } catch (sessionError) {
        logAuthDiagnostic("resetPassword.verifySession", sessionError);
        router.replace("/login?next=/dashboard/reset-password");
        return;
      } finally {
        setCheckingSession(false);
      }
    }

    void verifySession();
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        logAuthDiagnostic("resetPassword.updateUser", updateError);
        setError(toFriendlyAuthError(updateError));
        return;
      }

      setSuccess(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { destination } = await completeAuthenticatedLogin(supabase, user);
        window.setTimeout(() => {
          window.location.assign(destination);
        }, 1800);
      }
    } catch (submitError) {
      logAuthDiagnostic("resetPassword.submit", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not update your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="auth-shell flex min-h-dvh items-center justify-center bg-background p-6">
        <LoadingSpinner label="Verifying reset link..." />
      </div>
    );
  }

  return (
    <div className="auth-shell flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="air-card w-full max-w-lg air-card-pad">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-tight text-slate-900">menulia.net</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Choose a new password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a strong password for your Menulia account.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Your password has been updated. Redirecting you to the dashboard…
            </p>
            <Button type="button" className="w-full" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="air-label">
                New password
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="air-label">
                Confirm password
              </label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat your new password"
              />
            </div>

            {error && <p className="air-alert-error">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Updating..." : "Update password"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="air-link">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
