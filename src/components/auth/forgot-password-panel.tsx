"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { logAuthDiagnostic, toFriendlyAuthError } from "@/lib/auth/messages";

interface ForgotPasswordPanelProps {
  defaultEmail?: string;
  onClose: () => void;
}

export function ForgotPasswordPanel({ defaultEmail = "", onClose }: ForgotPasswordPanelProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = getAuthCallbackUrl("/dashboard/reset-password");

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (resetError) {
        logAuthDiagnostic("forgotPassword.resetPasswordForEmail", resetError);
        setError(toFriendlyAuthError(resetError));
        return;
      }

      setSent(true);
    } catch (submitError) {
      logAuthDiagnostic("forgotPassword.submit", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not send the reset email. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      onClick={onClose}
    >
      <div
        className="air-card relative w-full max-w-md air-card-pad shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-[#F5F5F7] hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="forgot-password-title" className="text-lg font-semibold text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send a secure link to choose a new password.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Check your inbox for a password reset link. It may take a minute to arrive.
            </p>
            <Button type="button" className="w-full" onClick={onClose}>
              Back to login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="forgot-email" className="air-label">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@restaurant.com"
                className="air-input"
              />
            </div>

            {error && <p className="air-alert-error">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
