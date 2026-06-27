"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { completeAuthenticatedLogin } from "@/lib/auth/profile";
import { logAuthDiagnostic, toFriendlyAuthError } from "@/lib/auth/messages";

export function LoginForm() {
  const router = useRouter();
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

    try {
      setSubmitting(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        logAuthDiagnostic("login.signInWithPassword", signInError);
        setError(toFriendlyAuthError(signInError));
        return;
      }

      if (!data.session?.user) {
        setError("Your session could not be started. Please try again.");
        return;
      }

      const { destination } = await completeAuthenticatedLogin(supabase);

      const nextParam = searchParams.get("next");
      const finalDestination =
        nextParam && nextParam.startsWith("/dashboard") ? nextParam : destination;

      router.replace(finalDestination);
      router.refresh();
    } catch (submitError) {
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
