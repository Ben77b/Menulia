"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { completeAuthenticatedLogin } from "@/lib/auth/profile";
import { logAuthDiagnostic, toFriendlyAuthError } from "@/lib/auth/messages";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        console.error("[auth:login.signInWithPassword]");
        console.dir(signInError, { depth: null });
        logAuthDiagnostic("login.signInWithPassword", signInError);
        setError(toFriendlyAuthError(signInError));
        return;
      }

      if (!data.session?.user?.id || !data.session.access_token) {
        const {
          data: { session: fallbackSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[auth:login.getSession]");
          console.dir(sessionError, { depth: null });
          logAuthDiagnostic("login.getSession", sessionError);
          setError(toFriendlyAuthError(sessionError));
          return;
        }

        if (!fallbackSession?.user?.id || !fallbackSession.access_token) {
          setError("Your session could not be started. Please try again.");
          return;
        }

        const { destination } = await completeAuthenticatedLogin(supabase, fallbackSession.user);
        const nextParam = searchParams.get("next");
        const finalDestination =
          nextParam && nextParam.startsWith("/dashboard") ? nextParam : destination;
        window.location.assign(finalDestination);
        return;
      }

      const { destination } = await completeAuthenticatedLogin(supabase, data.session.user);

      const nextParam = searchParams.get("next");
      const finalDestination =
        nextParam && nextParam.startsWith("/dashboard") ? nextParam : destination;

      window.location.assign(finalDestination);
    } catch (submitError) {
      console.error("[auth:login.submit]");
      console.dir(submitError, { depth: null });
      logAuthDiagnostic("login.submit", submitError);
      setError(
        submitError instanceof Error
          ? toFriendlyAuthError(submitError)
          : "We could not sign you in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@restaurant.com"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        New to Menulia?{" "}
        <Link href="/signup" className="font-medium text-emerald-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
