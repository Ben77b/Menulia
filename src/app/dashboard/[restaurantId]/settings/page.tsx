"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { HoursScheduleBuilder } from "@/components/dashboard/hours-schedule-builder";
import { SettingsSubNav } from "@/components/dashboard/settings-sub-nav";
import {
  SettingsMenuPreview,
  type SettingsLivePreviewInput,
} from "@/components/dashboard/settings-menu-preview";
import {
  Clock,
  Link2,
  Trash2,
  Plus,
  Building2,
  AlertTriangle,
  MapPin,
  Phone,
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
  deleteRestaurant,
  loadRestaurantSettings,
  saveFullRestaurantSettings,
} from "@/lib/restaurant-settings";
import { MAX_CUSTOM_LINKS, MAX_LINK_LABEL_LENGTH } from "@/lib/menu-limits";

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

type SettingsTab = "general" | "hours-location" | "social-links" | "danger";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "hours-location", label: "Hours & Location" },
  { id: "social-links", label: "Social & Links" },
  { id: "danger", label: "Danger Zone" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [scheduleBlocks, setScheduleBlocks] = useState<HoursScheduleBlock[]>(defaultScheduleBlocks());
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [footerSlogan, setFooterSlogan] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantTagline, setRestaurantTagline] = useState("");
  const [restaurantLocation, setRestaurantLocation] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const slugRegex = useMemo(() => /^[a-z0-9-]+$/, []);
  const supabase = getSupabaseBrowserClient();

  const livePreview: SettingsLivePreviewInput = useMemo(
    () => ({
      restaurantName,
      location: restaurantLocation,
      phone: restaurantPhone,
      email: restaurantEmail,
      scheduleBlocks,
      footerSlogan,
      links: customLinks,
    }),
    [
      restaurantName,
      restaurantLocation,
      restaurantPhone,
      restaurantEmail,
      scheduleBlocks,
      footerSlogan,
      customLinks,
    ]
  );

  useEffect(() => {
    if (currentRestaurant) {
      loadRestaurantData();
    }
  }, [currentRestaurant]);

  async function loadRestaurantData() {
    if (!currentRestaurant) return;

    setLoadError(null);

    try {
      const data = await loadRestaurantSettings(supabase, currentRestaurant.id);

      setRestaurantName(data.name);
      setRestaurantTagline(data.tagline);
      setRestaurantLocation(data.location);
      setRestaurantSlug(data.slug);
      setOriginalSlug(data.slug);

      const parsedHours = parseHoursSchedule(data.hours);
      setScheduleBlocks(parsedHours ?? defaultScheduleBlocks());

      const contact = parseContactInfo(data.contact_info);
      setRestaurantPhone(contact.phone);
      setRestaurantEmail(contact.email);

      setFooterSlogan(data.footer_slogan);

      setCustomLinks(
        data.custom_links.map((link) => ({
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
          return;
        }
      }

      const result = await saveFullRestaurantSettings(supabase, restaurantId, {
        name: restaurantName,
        slug: restaurantSlug,
        originalSlug,
        tagline: restaurantTagline,
        location: restaurantLocation,
        phone: restaurantPhone,
        email: restaurantEmail,
        scheduleBlocks,
        footerSlogan,
        links: customLinks,
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
      setSaveError(formatRestaurantSettingsError(error));
    } finally {
      setSaving(false);
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
    if (customLinks.length >= MAX_CUSTOM_LINKS) return;
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

  async function handleDeleteRestaurant() {
    if (!currentRestaurant?.id) return;
    if (deleteConfirmText.trim() !== currentRestaurant.name.trim()) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteRestaurant(supabase, currentRestaurant.id);
      localStorage.removeItem("menulia_current_restaurant");
      const remaining = await refreshRestaurants();
      setDeleteModalOpen(false);
      router.push(remaining.length > 0 ? `/dashboard/${remaining[0].id}` : "/dashboard");
    } catch (error) {
      console.error("[DeleteRestaurant:Failed]", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete restaurant."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="air-page-title">Restaurant Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage profile, contact details, hours, and links for this restaurant
          </p>
        </div>
        {activeTab !== "danger" && (
          <Button
            size="lg"
            onClick={saveChanges}
            disabled={saving || !currentRestaurant?.id || Boolean(slugError)}
          >
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
          </Button>
        )}
      </div>

      {loadError && (
        <div className="mb-4 shrink-0 air-alert-warning">
          {loadError}
        </div>
      )}

      {saveError && (
        <div className="mb-4 shrink-0 air-alert-error">
          {saveError}
        </div>
      )}

      <div className="mb-4 shrink-0">
        <SettingsSubNav items={SETTINGS_TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-8">
        <div className="min-w-0 space-y-6 pb-8">
          {activeTab === "general" && (
            <div className="air-card air-card-pad">
              <div className="mb-4 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Restaurant Name & Tagline</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="air-input"
                    placeholder="Your Restaurant Name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Tagline</label>
                  <input
                    type="text"
                    value={restaurantTagline}
                    onChange={(e) => setRestaurantTagline(e.target.value)}
                    className="air-input"
                    placeholder="Fresh seasonal cuisine in the heart of the city"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Short description shown in search previews and metadata
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Public Menu URL
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">menulia.net/menu/</span>
                    <input
                      type="text"
                      value={restaurantSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="air-input flex-1"
                      placeholder="your-restaurant-slug"
                    />
                  </div>
                  {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "hours-location" && (
            <>
              <div className="air-card air-card-pad">
                <div className="mb-4 flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Physical Location
                      </span>
                    </label>
                    <input
                      type="text"
                      value={restaurantLocation}
                      onChange={(e) => setRestaurantLocation(e.target.value)}
                      className="air-input"
                      placeholder="123 Main Street, Dublin"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={restaurantPhone}
                        onChange={(e) => setRestaurantPhone(e.target.value)}
                        className="air-input"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={restaurantEmail}
                        onChange={(e) => setRestaurantEmail(e.target.value)}
                        className="air-input"
                        placeholder="hello@restaurant.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="air-card air-card-pad">
                <div className="mb-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Opening Hours</h2>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Set weekly schedules — saved as your public menu hours line.
                </p>
                <HoursScheduleBuilder blocks={scheduleBlocks} onChange={setScheduleBlocks} />
              </div>
            </>
          )}

          {activeTab === "social-links" && (
            <div className="air-card air-card-pad">
              <div className="mb-4 flex items-center gap-3">
                <Link2 className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Links & Custom Footer Notes</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Custom Links</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomLink}
                      className="gap-1"
                      disabled={customLinks.length >= MAX_CUSTOM_LINKS}
                    >
                      <Plus className="h-4 w-4" />
                      Add Link
                    </Button>
                  </div>
                  {customLinks.length === 0 ? (
                    <p className="text-xs italic text-gray-500">No custom links added yet</p>
                  ) : (
                    <div className="space-y-3">
                      {customLinks.map((link) => (
                        <div
                          key={link.id}
                          className="air-card flex items-start gap-2 p-3"
                        >
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) =>
                                updateCustomLink(
                                  link.id,
                                  "label",
                                  e.target.value.slice(0, MAX_LINK_LABEL_LENGTH)
                                )
                              }
                              maxLength={MAX_LINK_LABEL_LENGTH}
                              placeholder="Link label (e.g., TripAdvisor)"
                              className="air-input h-9"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateCustomLink(link.id, "url", e.target.value)}
                              placeholder="https://..."
                              className="air-input h-9"
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
                  <h3 className="mb-3 text-sm font-medium text-gray-700">Footer Note</h3>
                  <textarea
                    value={footerSlogan}
                    onChange={(e) => setFooterSlogan(e.target.value)}
                    placeholder="We recommend reservations after 12 PM"
                    rows={6}
                    className="air-textarea"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="rounded-xl border-2 border-red-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Permanently delete this restaurant, its menu, and all associated data.
              </p>
              <div className="air-card flex items-center justify-between border-red-100 bg-red-50 p-4">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete Restaurant</h3>
                  <p className="text-xs text-gray-600">
                    This action cannot be undone. All categories, dishes, and design settings will
                    be removed.
                  </p>
                </div>
                <Button
                  variant="danger"
                  className="shrink-0 gap-2"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setDeleteError(null);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Restaurant
                </Button>
              </div>
            </div>
          )}

          {activeTab !== "danger" && (
            <div className="flex justify-end border-t border-gray-100 pt-6 lg:hidden">
              <Button
                size="lg"
                onClick={saveChanges}
                disabled={saving || !currentRestaurant?.id || Boolean(slugError)}
              >
                {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <SettingsMenuPreview restaurantId={currentRestaurant?.id} live={livePreview} />
      </div>

      {deleteModalOpen && currentRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Restaurant</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete <strong>{currentRestaurant.name}</strong> and all menu
              data. Type the restaurant name to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={currentRestaurant.name}
              className="air-input mt-4 focus:ring-red-500/20"
            />
            {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteRestaurant}
                disabled={
                  deleting || deleteConfirmText.trim() !== currentRestaurant.name.trim()
                }
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
