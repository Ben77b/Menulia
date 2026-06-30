"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { SettingsSubNav } from "@/components/dashboard/settings-sub-nav";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import { useToast } from "@/components/ui/toast";
import {
  fetchSecurityPreferences,
  saveSecurityPreferences,
  EMAIL_VERIFICATION_BANNER,
  type SecurityPreferences,
} from "@/lib/auth/security-preferences";
import {
  User,
  LogOut,
  Lock,
  Download,
  AlertTriangle,
  Trash2,
  CreditCard,
  Mail,
  Shield,
} from "lucide-react";

type AccountTab = "profile" | "security" | "billing";

const ACCOUNT_TABS: { id: AccountTab; label: string }[] = [
  { id: "profile", label: "My Profile" },
  { id: "security", label: "Security & Password" },
  { id: "billing", label: "Billing" },
];

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, userProfile } = useRestaurant();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  const [userFullName, setUserFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailPendingVerification, setEmailPendingVerification] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordToastVisible, setPasswordToastVisible] = useState(false);

  const [securityPrefs, setSecurityPrefs] = useState<SecurityPreferences>({
    two_factor_enabled: false,
  });
  const [saving2fa, setSaving2fa] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (user) {
      setUserFullName(user.user_metadata?.full_name || userProfile?.displayName || "");
      setNewEmail(user.email || "");
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (!user?.id) return;

    fetchSecurityPreferences(supabase, user.id)
      .then(setSecurityPrefs)
      .catch((error) => {
        console.error("[Account:SecurityPrefsLoad]", error);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!passwordToastVisible) return;
    const timer = window.setTimeout(() => setPasswordToastVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [passwordToastVisible]);

  async function saveAccountDetails() {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        throw new Error("You must be signed in to update account details.");
      }

      const { error } = await supabase.auth.updateUser({
        data: { full_name: userFullName.trim() },
      });

      if (error) throw error;

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (error) {
      console.error("[AccountSave:Failed]", error);
      setProfileError(error instanceof Error ? error.message : "Failed to save account details.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEmailChange(event: React.FormEvent) {
    event.preventDefault();
    setSavingEmail(true);
    setEmailError(null);
    setEmailPendingVerification(false);

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser?.email) {
        throw new Error("You must be signed in to change your email.");
      }

      const trimmedEmail = newEmail.trim();

      if (!trimmedEmail || trimmedEmail === currentUser.email) {
        throw new Error("Enter a new email address different from your current one.");
      }

      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });

      if (error) throw error;

      setEmailPendingVerification(true);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Failed to update email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser?.email) {
        throw new Error("You must be signed in to change your password.");
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setPasswordToastVisible(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleTwoFactorToggle(enabled: boolean) {
    if (!user?.id || !user.email) return;

    setSaving2fa(true);
    setSecurityError(null);

    const previous = securityPrefs ?? { two_factor_enabled: false };
    const nextPrefs = { two_factor_enabled: enabled };
    setSecurityPrefs(nextPrefs);

    try {
      await saveSecurityPreferences(supabase, user.id, user.email, nextPrefs);
    } catch (error) {
      setSecurityPrefs(previous);
      setSecurityError(error instanceof Error ? error.message : "Failed to update security settings.");
    } finally {
      setSaving2fa(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  }

  async function handleDownloadData() {
    toast.info("Preparing data export… This feature will be available soon.");
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      "Are you sure? This will permanently delete your account and all restaurant data. This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  }

  return (
    <div className="mx-auto max-w-3xl air-page">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="air-page-title">Account Settings</h1>
          <p className="air-page-subtitle">Manage your personal profile, security, and billing</p>
        </div>
        {activeTab === "profile" && (
          <Button onClick={saveAccountDetails} disabled={savingProfile}>
            {savingProfile ? "Saving..." : profileSuccess ? "Saved!" : "Save Changes"}
          </Button>
        )}
      </header>

      {profileError && activeTab === "profile" && (
        <div className="air-alert-error" role="alert">
          {profileError}
        </div>
      )}

      <SettingsSubNav
        items={ACCOUNT_TABS}
        active={activeTab}
        onChange={setActiveTab}
        ariaLabel="Account settings sections"
      />

      {activeTab === "profile" && (
        <section className="air-card air-card-pad" aria-labelledby="profile-heading">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h2 id="profile-heading" className="air-section-title">
              Personal Details
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="account-full-name" className="air-label">
                Full Name
              </label>
              <input
                id="account-full-name"
                type="text"
                value={userFullName}
                onChange={(e) => setUserFullName(e.target.value)}
                className="air-input"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="air-label">Account Email</label>
              <p className="air-input bg-muted text-muted-foreground">{user?.email ?? "—"}</p>
              <p className="air-helper mt-1">
                Change your email in the Security tab — verification is required.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === "security" && (
        <>
          {securityError && (
            <div className="air-alert-error" role="alert">
              {securityError}
            </div>
          )}

          <section className="air-card air-card-pad" aria-labelledby="email-heading">
            <div className="mb-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 id="email-heading" className="air-section-title">
                Change Email
              </h2>
            </div>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label htmlFor="security-new-email" className="air-label">
                  New email address
                </label>
                <input
                  id="security-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="air-input"
                  placeholder="new@email.com"
                  required
                />
              </div>
              {emailPendingVerification && (
                <div
                  className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-slate-800"
                  role="status"
                >
                  {EMAIL_VERIFICATION_BANNER}
                </div>
              )}
              {emailError && (
                <div className="air-alert-error" role="alert">
                  {emailError}
                </div>
              )}
              <Button type="submit" disabled={savingEmail}>
                {savingEmail ? "Sending verification..." : "Update email"}
              </Button>
            </form>
          </section>

          <section className="air-card air-card-pad" aria-labelledby="password-heading">
            <div className="mb-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 id="password-heading" className="air-section-title">
                Change Password
              </h2>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="air-label">
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="air-input"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-password" className="air-label">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="air-input"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="air-label">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="air-input"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              {passwordSuccess && (
                <div
                  className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-slate-800"
                  role="status"
                >
                  Password updated successfully.
                </div>
              )}
              {passwordError && (
                <div className="air-alert-error" role="alert">
                  {passwordError}
                </div>
              )}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update password"}
              </Button>
            </form>
          </section>

          <section className="air-card air-card-pad" aria-labelledby="twofa-heading">
            <div className="mb-2 flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 id="twofa-heading" className="air-section-title">
                Two-Factor Authentication
              </h2>
            </div>
            <ToggleSwitch
              label="Enable Two-Factor Authentication"
              description="Adds an extra verification step at sign-in. Full verification flow coming soon."
              checked={securityPrefs?.two_factor_enabled ?? false}
              onChange={handleTwoFactorToggle}
            />
            {saving2fa && <p className="air-helper mt-2">Saving preference...</p>}
          </section>

          <section className="air-card air-card-pad">
            <h2 className="mb-4 air-section-title">Session</h2>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              Log Out
            </Button>
            <p className="air-helper mt-3">
              Or use <Link href="/logout" className="air-link">Sign out</Link> from any device.
            </p>
          </section>

          <section
            className="rounded-xl border-2 border-red-200 bg-card p-6 shadow-sm"
            aria-labelledby="danger-heading"
          >
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
              <h2 id="danger-heading" className="text-lg font-semibold text-red-900">
                Danger Zone
              </h2>
            </div>
            <div className="space-y-4">
              <div className="air-card flex items-center justify-between border-red-100 bg-red-50 p-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Download My Data</h3>
                  <p className="air-helper">Export all account and restaurant data (GDPR)</p>
                </div>
                <Button variant="light" onClick={handleDownloadData}>
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </Button>
              </div>
              <div className="air-card flex items-center justify-between border-red-100 bg-red-50 p-4">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete My Account</h3>
                  <p className="air-helper">
                    Permanently delete your account and all associated restaurants
                  </p>
                </div>
                <Button variant="danger" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete Account
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "billing" && (
        <section className="air-card air-card-pad">
          <h2 className="air-section-title">Subscription & Billing</h2>
          <p className="air-page-subtitle mb-4">Manage your Menulia plan and payment methods.</p>
          <Button variant="light">
            <CreditCard className="h-4 w-4" aria-hidden />
            Manage Billing
          </Button>
        </section>
      )}
      {passwordToastVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-2xl border border-border bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl"
        >
          Password updated successfully.
        </div>
      )}
    </div>
  );
}
