"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { HoursScheduleBuilder } from "@/components/dashboard/hours-schedule-builder";
import { SettingsSubNav } from "@/components/dashboard/settings-sub-nav";
import { SettingsLanguagesPanel } from "@/components/dashboard/settings-languages-panel";
import {
  SettingsMenuPreview,
} from "@/components/dashboard/settings-menu-preview";
import {
  Clock,
  Link2,
  Trash2,
  Plus,
  Building2,
  AlertTriangle,
  Phone,
} from "lucide-react";
import {
  formatRestaurantSettingsError,
  isRestaurantSlugAvailable,
  slugCollisionMessage,
} from "@/lib/restaurant-slug";
import {
  deleteRestaurant,
  saveFullRestaurantSettings,
} from "@/lib/restaurant-settings";
import { MAX_CUSTOM_LINKS, MAX_LINK_LABEL_LENGTH } from "@/lib/menu-limits";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";
import { useDashboardSearchParam } from "@/hooks/use-dashboard-search-param";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSettingsFormDraft } from "@/hooks/use-settings-form-draft";
import {
  DashboardFieldLabel,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-section-card";
import { SettingsTransferPanel } from "@/components/dashboard/settings-transfer-panel";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";

type SettingsTab = "general" | "hours-location" | "social-links" | "languages" | "danger";

const SETTINGS_TAB_IDS: SettingsTab[] = [
  "general",
  "hours-location",
  "social-links",
  "languages",
  "danger",
];

function SettingsPageContent() {
  const router = useRouter();
  const { refreshRestaurants } = useRestaurant();
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const { t } = useDashboardLocale();

  const settingsTabs = useMemo(
    (): { id: SettingsTab; label: string }[] => [
      { id: "general", label: t("settings.tab.general") },
      { id: "hours-location", label: t("settings.tab.hours") },
      { id: "social-links", label: t("settings.tab.social") },
      { id: "languages", label: t("settings.tab.languages") },
      { id: "danger", label: t("settings.tab.danger") },
    ],
    [t]
  );

  const {
    formDraft,
    patchDraft,
    loadDraftFromServer,
    livePreview,
    markDraftSaved,
    saveForm,
    setScheduleBlocks,
    setCustomLinks,
  } = useSettingsFormDraft(activeRestaurant?.id);

  const {
    restaurantName,
    restaurantTagline,
    restaurantLocation,
    restaurantPhone,
    restaurantEmail,
    restaurantSlug,
    originalSlug,
    footerSlogan,
    primaryLanguage,
    scheduleBlocks,
    customLinks,
  } = formDraft;

  const [activeTab, setActiveTab] = useDashboardSearchParam(
    "tab",
    SETTINGS_TAB_IDS,
    "general"
  ) as [SettingsTab, (tab: SettingsTab) => void];
  const [slugError, setSlugError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const slugRegex = useMemo(() => /^[a-z0-9-]+$/, []);
  const supabase = getSupabaseBrowserClient();

  async function saveChanges() {
    if (!activeRestaurant?.id) return;

    const restaurantId = activeRestaurant.id;
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

      const result = await saveFullRestaurantSettings(supabase, restaurantId, saveForm);

      if (result.normalizedSlug) {
        markDraftSaved({
          originalSlug: result.normalizedSlug,
          restaurantSlug: result.normalizedSlug,
        });
      } else {
        markDraftSaved();
      }

      await refreshRestaurants({ silent: true });
      try {
        await loadDraftFromServer();
      } catch (error) {
        console.error("[SettingsReload:Failed]", error);
      }
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
    patchDraft({ restaurantSlug: formatted });

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

  function updateCustomLink(id: string, field: "label" | "url", value: string) {
    setCustomLinks(
      customLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    );
  }

  async function handleDeleteRestaurant() {
    if (!activeRestaurant?.id) return;
    if (deleteConfirmText.trim() !== activeRestaurant.name.trim()) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteRestaurant(supabase, activeRestaurant.id);
      localStorage.removeItem("menulia_current_restaurant");
      const remaining = await refreshRestaurants({ silent: true });
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

  if (awaitingWorkspace) {
    return (
      <div className="air-page mx-auto max-w-3xl py-12 text-center text-muted-foreground">
        <LoadingSpinner label="Loading settings…" />
      </div>
    );
  }

  if (!activeRestaurant?.id) {
    return (
      <div className="air-page mx-auto max-w-3xl py-12 text-center text-muted-foreground">
        Select a restaurant to manage settings.
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="air-page-title">{t("settings.pageTitle")}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage profile, contact details, hours, and links for this restaurant
          </p>
        </div>
        {activeTab !== "danger" && activeTab !== "languages" && (
          <Button
            size="lg"
            onClick={saveChanges}
            disabled={saving || Boolean(slugError)}
          >
            {saving ? t("common.saving") : saveSuccess ? t("branding.saved") : t("branding.saveChanges")}
          </Button>
        )}
      </div>

      {saveError && (
        <div className="mb-4 shrink-0 air-alert-error">
          {saveError}
        </div>
      )}

      <div className="mb-4 shrink-0">
        <SettingsSubNav items={settingsTabs} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-8">
        <div className="min-w-0 space-y-6 pb-8">
          {activeTab === "general" && (
            <DashboardSectionCard
              title="Restaurant Name & Tagline"
              description="Your public identity — name, tagline, and menu URL slug."
              icon={<Building2 className="h-5 w-5" />}
            >
              <div>
                <DashboardFieldLabel label="Restaurant Name" />
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => patchDraft({ restaurantName: e.target.value })}
                  className="air-input"
                  placeholder="Your Restaurant Name"
                />
              </div>
              <div>
                <DashboardFieldLabel
                  label="Tagline"
                  hint="Short description shown in search previews and metadata"
                />
                <input
                  type="text"
                  value={restaurantTagline}
                  onChange={(e) => patchDraft({ restaurantTagline: e.target.value })}
                  className="air-input"
                  placeholder="Fresh seasonal cuisine in the heart of the city"
                />
              </div>
              <div>
                <DashboardFieldLabel
                  label="Public Menu URL"
                  hint="The slug guests use at menulia.net/menu/your-slug"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">menulia.net/menu/</span>
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
            </DashboardSectionCard>
          )}

          {activeTab === "hours-location" && (
            <>
              <DashboardSectionCard
                title="Contact Information"
                description="Address, phone, and email shown on your public menu footer."
                icon={<Phone className="h-5 w-5" />}
              >
                <div>
                  <DashboardFieldLabel
                    label="Physical Location"
                    hint="Street address or neighborhood guests can find you"
                  />
                  <input
                    type="text"
                    value={restaurantLocation}
                    onChange={(e) => patchDraft({ restaurantLocation: e.target.value })}
                    className="air-input"
                    placeholder="123 Main Street, Dublin"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <DashboardFieldLabel label="Phone Number" />
                    <input
                      type="tel"
                      value={restaurantPhone}
                      onChange={(e) => patchDraft({ restaurantPhone: e.target.value })}
                      className="air-input"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div>
                    <DashboardFieldLabel label="Contact Email" />
                    <input
                      type="email"
                      value={restaurantEmail}
                      onChange={(e) => patchDraft({ restaurantEmail: e.target.value })}
                      className="air-input"
                      placeholder="hello@restaurant.com"
                    />
                  </div>
                </div>
              </DashboardSectionCard>

              <DashboardSectionCard
                title="Opening Hours"
                description="Weekly schedule saved as your public menu hours line."
                icon={<Clock className="h-5 w-5" />}
              >
                <HoursScheduleBuilder blocks={scheduleBlocks} onChange={setScheduleBlocks} />
              </DashboardSectionCard>
            </>
          )}

          {activeTab === "social-links" && (
            <DashboardSectionCard
              title="Links & Custom Footer Notes"
              description="Footer note and custom links shown at the bottom of your public menu."
              icon={<Link2 className="h-5 w-5" />}
            >
              <div>
                <DashboardFieldLabel
                  label="Footer Note"
                  hint="A short message or policy note for guests"
                />
                <textarea
                  value={footerSlogan}
                  onChange={(e) => patchDraft({ footerSlogan: e.target.value })}
                  placeholder="We recommend reservations after 12 PM"
                  rows={6}
                  className="air-textarea"
                />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <DashboardFieldLabel
                    label="Custom Links"
                    hint="TripAdvisor, reservations, social profiles, and more"
                  />
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
                  <p className="text-xs italic text-slate-400">No custom links added yet</p>
                ) : (
                  <div className="space-y-3">
                    {customLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
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
            </DashboardSectionCard>
          )}

          {activeTab === "languages" && (
            <SettingsLanguagesPanel
              restaurantId={activeRestaurant.id}
              restaurantName={activeRestaurant.name}
              primaryLanguage={primaryLanguage}
              onPrimaryLanguageChange={(language) => patchDraft({ primaryLanguage: language })}
              onPrimaryLanguageSaved={async () => {
                await refreshRestaurants({ silent: true });
                await loadDraftFromServer();
              }}
            />
          )}

          {activeTab === "danger" && (
            <div className="space-y-6">
              <SettingsTransferPanel restaurantId={activeRestaurant.id} />

              <section className="rounded-2xl border-2 border-red-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-red-900">Danger Zone</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Permanently delete this restaurant, its menu, and all associated data.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/80 p-4">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete Restaurant</h3>
                  <p className="mt-1 text-xs text-slate-400">
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
            </section>
            </div>
          )}

          {activeTab !== "danger" && activeTab !== "languages" && (
            <div className="flex justify-end border-t border-gray-100 pt-6 lg:hidden">
              <Button
                size="lg"
                onClick={saveChanges}
                disabled={saving || Boolean(slugError)}
              >
                {saving ? t("common.saving") : saveSuccess ? t("branding.saved") : t("branding.saveChanges")}
              </Button>
            </div>
          )}
        </div>

        <ClientErrorBoundary title="Preview failed to load">
          <SettingsMenuPreview restaurantId={activeRestaurant.id} live={livePreview} />
        </ClientErrorBoundary>
      </div>

      {deleteModalOpen && activeRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Restaurant</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete <strong>{activeRestaurant.name}</strong> and all menu
              data. Type the restaurant name to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={activeRestaurant.name}
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
                  deleting || deleteConfirmText.trim() !== activeRestaurant.name.trim()
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading settings..." />}>
      <SettingsPageContent />
    </Suspense>
  );
}
