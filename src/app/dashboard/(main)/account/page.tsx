"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { SettingsSubNav } from "@/components/dashboard/settings-sub-nav";
import {
  User,
  LogOut,
  Lock,
  Download,
  AlertTriangle,
  Trash2,
  CreditCard,
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
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      setUserFullName(user.user_metadata?.full_name || userProfile?.displayName || "");
    }
  }, [user, userProfile]);

  async function saveAccountDetails() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

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
        ...(userEmail.trim() && userEmail.trim() !== currentUser.email
          ? { email: userEmail.trim() }
          : {}),
      });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("[AccountSave:Failed]", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save account details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out");
    }
  }

  async function handleDownloadData() {
    alert("Preparing data export... This feature will be available soon.");
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
      alert("Failed to delete account");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="air-page-title">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your personal profile, security, and billing
          </p>
        </div>
        {activeTab === "profile" && (
          <Button size="lg" className="px-8" onClick={saveAccountDetails} disabled={saving}>
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
          </Button>
        )}
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <SettingsSubNav
        items={ACCOUNT_TABS}
        active={activeTab}
        onChange={setActiveTab}
        ariaLabel="Account settings sections"
      />

      {activeTab === "profile" && (
        <div className="air-card air-card-pad">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={userFullName}
                onChange={(e) => setUserFullName(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Account Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email changes may require verification from your inbox.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <>
          <div className="air-card air-card-pad">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Session & Security</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
              <Button variant="danger" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Or use{" "}
              <Link href="/logout" className="text-indigo-600 hover:underline">
                Sign out
              </Link>{" "}
              from any device.
            </p>
          </div>

          <div className="rounded-xl border-2 border-red-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Download My Data</h3>
                  <p className="text-xs text-gray-600">Export all account and restaurant data (GDPR)</p>
                </div>
                <Button variant="outline" className="shrink-0 gap-2" onClick={handleDownloadData}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete My Account</h3>
                  <p className="text-xs text-gray-600">
                    Permanently delete your account and all associated restaurants
                  </p>
                </div>
                <Button variant="danger" className="shrink-0 gap-2" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "billing" && (
        <div className="air-card air-card-pad">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Subscription & Billing</h2>
          <p className="mb-4 text-sm text-gray-600">
            Manage your Menulia plan and payment methods.
          </p>
          <Button variant="outline" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Manage Billing
          </Button>
        </div>
      )}
    </div>
  );
}
