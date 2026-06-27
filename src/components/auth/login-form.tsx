"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolvePostAuthDashboardRoute } from "@/lib/auth/session";

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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        console.error("[LoginForm] signIn failed:", {
          message: signInError.message,
          code: signInError.code,
          status: signInError.status,
        });
        throw signInError;
      }

      const destination =
        searchParams.get("next") && searchParams.get("next")!.startsWith("/dashboard")
          ? searchParams.get("next")!
          : await resolvePostAuthDashboardRoute(supabase);

      router.replace(destination);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to log in.";
      setError(message);
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
