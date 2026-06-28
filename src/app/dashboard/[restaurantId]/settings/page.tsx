"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { HoursScheduleBuilder } from "@/components/dashboard/hours-schedule-builder";
import {
  Clock,
  Link2,
  Trash2,
  Plus,
  Building2,
  User,
  LogOut,
  Lock,
  Download,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  defaultScheduleBlocks,
  parseHoursSchedule,
  type HoursScheduleBlock,
} from "@/lib/hours-schedule";
import { parseContactInfo } from "@/lib/contact-info";
import {
  formatRestaurantSettingsError,
  isRestaurantSlugAvailable,
  slugCollisionMessage,
} from "@/lib/restaurant-slug";
import {
  loadRestaurantSettings,
  saveRestaurantSettings,
} from "@/lib/restaurant-settings";
import { fetchRestaurantLinks, saveRestaurantLinks } from "@/lib/restaurant-links";

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const [scheduleBlocks, setScheduleBlocks] = useState<HoursScheduleBlock[]>(defaultScheduleBlocks());
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [footerSlogan, setFooterSlogan] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantLocation, setRestaurantLocation] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const slugRegex = useMemo(() => /^[a-z0-9-]+$/, []);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (currentRestaurant) {
      loadRestaurantData();
    }
  }, [currentRestaurant]);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setUserFullName(user.user_metadata?.full_name || "");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  async function loadRestaurantData() {
    if (!currentRestaurant) return;

    setLoadError(null);

    try {
      const data = await loadRestaurantSettings(supabase, currentRestaurant.id);

      setRestaurantName(data.name);
      setRestaurantLocation(data.location);
      setRestaurantSlug(data.slug);
      setOriginalSlug(data.slug);

      const parsedHours = parseHoursSchedule(data.hours);
      setScheduleBlocks(parsedHours ?? defaultScheduleBlocks());

      const contact = parseContactInfo(data.contact_info);
      setRestaurantPhone(contact.phone);
      setRestaurantEmail(contact.email);

      setFooterSlogan(data.footer_slogan);

      const links = await fetchRestaurantLinks(currentRestaurant.id);
      setCustomLinks(
        links.map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
        }))
      );
    } catch (error) {
      console.error("[SettingsLoad:Failed]", error);
      const message =
        error instanceof Error ? error.message : "Failed to load restaurant settings.";
      setLoadError(message);
    }
  }

  async function saveChanges() {
    if (!currentRestaurant?.id) return;

    const restaurantId = currentRestaurant.id;
    const slugUnchanged = restaurantSlug.trim() === originalSlug.trim();
    const normalizedSlug = restaurantSlug.trim().toLowerCase();

    if (!slugUnchanged && !normalizedSlug) {
      setSlugError("URL slug is required.");
      return;
    }

    if (!slugUnchanged && !slugRegex.test(normalizedSlug)) {
      setSlugError("Slug must contain only lowercase letters, numbers, and hyphens");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setSlugError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in to save settings.");
      }

      if (!slugUnchanged) {
        const available = await isRestaurantSlugAvailable(supabase, normalizedSlug, restaurantId);
        if (!available) {
          const message = slugCollisionMessage();
          setSlugError(message);
          setSaveError(message);
          alert(message);
          return;
        }
      }

      const result = await saveRestaurantSettings(supabase, restaurantId, {
        name: restaurantName,
        slug: restaurantSlug,
        originalSlug,
        location: restaurantLocation,
        phone: restaurantPhone,
        email: restaurantEmail,
        scheduleBlocks,
      });

      if (result.normalizedSlug) {
        setOriginalSlug(result.normalizedSlug);
        setRestaurantSlug(result.normalizedSlug);
      }

      await refreshRestaurants();
      await loadRestaurantData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("[SettingsSave:Failed]", error);
      const message = formatRestaurantSettingsError(error);
      setSaveError(message);
      alert(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveFooterSettings() {
    if (!currentRestaurant) return;

    try {
      await saveRestaurantLinks(currentRestaurant.id, customLinks);

      const { error } = await supabase
        .from("restaurants")
        .update({
          footer_slogan: footerSlogan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRestaurant.id);

      if (error) {
        alert(formatRestaurantSettingsError(error));
        return;
      }

      alert("Footer settings saved!");
    } catch (error) {
      console.error("Error saving footer settings:", error);
      alert("Failed to save footer settings");
    }
  }

  function handleSlugChange(value: string) {
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setRestaurantSlug(formatted);

    if (formatted && !slugRegex.test(formatted)) {
      setSlugError("Slug must contain only lowercase letters, numbers, and hyphens");
    } else {
      setSlugError("");
    }
  }

  function addCustomLink() {
    setCustomLinks([
      ...customLinks,
      { id: Date.now().toString(), label: "", url: "" },
    ]);
  }

  function removeCustomLink(id: string) {
    setCustomLinks(customLinks.filter((link) => link.id !== id));
  }

  function updateCustomLink(id: string, field: keyof CustomLink, value: string) {
    setCustomLinks(
      customLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    );
  }

  async function saveAccountDetails() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { full_name: userFullName },
          email: userEmail,
        });
        alert(
          "Account details saved! If you changed your email, you will need to verify the new address before the change takes effect."
        );
      }
    } catch (error) {
      console.error("Error saving account details:", error);
      alert("Failed to save account details");
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
      "Are you sure? This will permanently delete your restaurant, menu, and account data. This cannot be undone."
    );
    if (confirmed) {
      try {
        await supabase.auth.signOut();
        router.push("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your restaurant profile and operations</p>
        </div>
        <Button
          size="lg"
          className="px-8"
          onClick={saveChanges}
          disabled={saving || !currentRestaurant?.id || Boolean(slugError)}
        >
          {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Profile</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Profile details saved directly to your restaurant record
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your Restaurant Name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={restaurantLocation}
                onChange={(e) => setRestaurantLocation(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="123 Main Street, Dublin"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={restaurantPhone}
                  onChange={(e) => setRestaurantPhone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  value={restaurantEmail}
                  onChange={(e) => setRestaurantEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="hello@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">menulia.net/menu/</span>
                <input
                  type="text"
                  value={restaurantSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your-restaurant-slug"
                />
              </div>
              {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Use only lowercase letters, numbers, and hyphens. No spaces.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Pick start and end times, then check the days each schedule applies to. Saved as a single
            hours line on your public menu.
          </p>

          <HoursScheduleBuilder blocks={scheduleBlocks} onChange={setScheduleBlocks} />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Public Page Footer & Links Settings</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Configure external links and footer content for your public menu page
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Custom Links</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCustomLink} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>

              {customLinks.length === 0 ? (
                <p className="text-xs italic text-gray-500">No custom links added yet</p>
              ) : (
                <div className="space-y-3">
                  {customLinks.map((link) => (
                    <div key={link.id} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateCustomLink(link.id, "label", e.target.value)}
                          placeholder="Link label (e.g., TripAdvisor)"
                          className="h-9 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateCustomLink(link.id, "url", e.target.value)}
                          placeholder="https://..."
                          className="h-9 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomLink(link.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">Footer Slogan / Note</h3>
              <p className="mb-3 text-xs text-gray-500">Add a custom note to display in your menu footer</p>
              <textarea
                value={footerSlogan}
                onChange={(e) => setFooterSlogan(e.target.value)}
                placeholder="We recommend reservations after 12 PM"
                rows={6}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <Button className="mt-4" onClick={saveFooterSettings}>
            Save Footer Settings
          </Button>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Manage your personal SaaS account details and security settings
          </p>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Personal Details</h3>
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
                  If you change your email, you will need to verify the new address before the change
                  takes effect.
                </p>
              </div>
              <Button onClick={saveAccountDetails}>Save Account Details</Button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-700">Subscription</h3>
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-700">Session & Security</h3>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
                <Button variant="danger" className="gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-2 border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Irreversible and destructive actions for your account and data
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Download My Data</h3>
                <p className="text-xs text-gray-600">
                  Export all your restaurant and account data (GDPR/CCPA compliance)
                </p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleDownloadData}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
              <div>
                <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                <p className="text-xs text-gray-600">
                  Permanently delete your restaurant, menu, and account data
                </p>
              </div>
              <Button variant="danger" className="gap-2" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
