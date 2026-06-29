"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/site-url";
import { buildUserProfile, syncUserProfileRecord } from "@/lib/auth/profile";
import { ensureAuthSessionCommitted } from "@/lib/auth/session";
import { logAuthDiagnostic, toFriendlyAuthError } from "@/lib/auth/messages";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

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

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
          emailRedirectTo: `${getSiteUrl()}/dashboard`,
        },
      });

      if (signUpError) {
        console.error("[auth:signup.signUp]");
        console.dir(signUpError, { depth: null });
        logAuthDiagnostic("signup.signUp", signUpError);
        setError(toFriendlyAuthError(signUpError));
        return;
      }

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          console.error("[auth:signup.signInAfterSignUp]");
          console.dir(signInError, { depth: null });
          setError("Account created. Please confirm your email address, then log in.");
          return;
        }
      }

      const session = await ensureAuthSessionCommitted(
        supabase,
        signUpData.user ?? undefined
      );
      const profile = buildUserProfile(session.user);
      await syncUserProfileRecord(supabase, profile);

      window.location.assign("/dashboard");
    } catch (submitError) {
      console.error("[auth:signup.submit]");
      console.dir(submitError, { depth: null });
      logAuthDiagnostic("signup.submit", submitError);
      setError(
        submitError instanceof Error
          ? toFriendlyAuthError(submitError)
          : "Unable to create your account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="air-label">
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="air-input"
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="air-label">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@restaurant.com"
          className="air-input"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="air-label">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="air-input"
        />
      </div>

      {error && <p className="air-alert-error">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="air-link">
          Log in
        </Link>
      </p>
    </form>
  );
}
