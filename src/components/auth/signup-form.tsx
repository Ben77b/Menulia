"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/site-url";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError("Please fill in your name, email, and password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = getSupabaseBrowserClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedName },
          emailRedirectTo: `${getSiteUrl()}/dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to create your account.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@restaurant.com"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-brand hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
