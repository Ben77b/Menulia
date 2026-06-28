"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
  defaultOperatingHours,
  formatOperatingHoursDisplay,
  normalizeOperatingHours,
  newTimeSlot,
  type OperatingHourData,
  type OperatingTimeSlot,
} from "@/lib/operating-hours";
import { fetchRestaurantLinks, saveRestaurantLinks } from "@/lib/restaurant-links";

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const [operatingHours, setOperatingHours] = useState<OperatingHourData[]>(defaultOperatingHours());
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [footerSlogan, setFooterSlogan] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantLocation, setRestaurantLocation] = useState("");
  const [restaurantContactInfo, setRestaurantContactInfo] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const slugRegex = useMemo(() => /^[a-z0-9-]+$/, []);

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

    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", currentRestaurant.id)
        .single();

      if (error) throw error;

      if (data) {
        setOperatingHours(normalizeOperatingHours(data.operating_hours));
        const links = await fetchRestaurantLinks(currentRestaurant.id);
        setCustomLinks(
          links.map((link) => ({
            id: link.id,
            label: link.label,
            url: link.url,
          }))
        );
        if (data.footer_slogan) {
          setFooterSlogan(data.footer_slogan || "");
        }
        if (data.name) {
          setRestaurantName(data.name);
        }
        setRestaurantLocation(data.location ?? "");
        setRestaurantContactInfo(data.contact_info ?? "");
        setRestaurantSlug(typeof data.slug === "string" ? data.slug : "");
      }
    } catch (error) {
      console.error("Error loading restaurant data:", error);
    }
  }

  async function saveOperatingHours() {
    if (!currentRestaurant) return;

    const hoursText = formatOperatingHoursDisplay(operatingHours);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          operating_hours: operatingHours,
          hours: hoursText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRestaurant.id);

      if (error) throw error;
      alert("Operating hours saved!");
    } catch (error) {
      console.error("Error saving operating hours:", error);
      alert("Failed to save operating hours");
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

      if (error) throw error;
      alert("Footer settings saved!");
    } catch (error) {
      console.error("Error saving footer settings:", error);
      alert("Failed to save footer settings");
    }
  }

  async function saveRestaurantProfile() {
    if (!currentRestaurant) return;

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: restaurantName,
          slug: restaurantSlug,
          location: restaurantLocation,
          contact_info: restaurantContactInfo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRestaurant.id);

      if (error) throw error;
      await refreshRestaurants();
      alert("Restaurant profile saved!");
    } catch (error) {
      console.error("Error saving restaurant profile:", error);
      alert("Failed to save restaurant profile");
    }
  }

  function handleDayOpenChange(dayIndex: number, isOpen: boolean) {
    setOperatingHours((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;
        return {
          ...day,
          isOpen,
          slots:
            isOpen && day.slots.length === 0
              ? [newTimeSlot(day.day, 1)]
              : day.slots,
        };
      })
    );
  }

  function handleSlotChange(
    dayIndex: number,
    slotIndex: number,
    field: keyof OperatingTimeSlot,
    value: string
  ) {
    setOperatingHours((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;
        return {
          ...day,
          slots: day.slots.map((slot, sIndex) =>
            sIndex === slotIndex ? { ...slot, [field]: value } : slot
          ),
        };
      })
    );
  }

  function addTimeSlot(dayIndex: number) {
    setOperatingHours((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;
        return {
          ...day,
          isOpen: true,
          slots: [...day.slots, newTimeSlot(day.day, day.slots.length + 1)],
        };
      })
    );
  }

  function removeTimeSlot(dayIndex: number, slotIndex: number) {
    setOperatingHours((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;
        const nextSlots = day.slots.filter((_, sIndex) => sIndex !== slotIndex);
        return {
          ...day,
          isOpen: nextSlots.length > 0 ? day.isOpen : false,
          slots: nextSlots,
        };
      })
    );
  }

  function addCustomLink() {
    const newLink: CustomLink = {
      id: Date.now().toString(),
      label: "",
      url: "",
    };
    setCustomLinks([...customLinks, newLink]);
  }

  function removeCustomLink(id: string) {
    setCustomLinks(customLinks.filter((link) => link.id !== id));
  }

  function updateCustomLink(id: string, field: keyof CustomLink, value: string) {
    setCustomLinks(
      customLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    );
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your restaurant operations and settings</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Profile</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">Update your restaurant&apos;s basic information</p>

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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Contact Info</label>
              <input
                type="text"
                value={restaurantContactInfo}
                onChange={(e) => setRestaurantContactInfo(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+353 1 234 5678 · hello@restaurant.com"
              />
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

          <Button className="mt-4" onClick={saveRestaurantProfile}>
            Save Profile
          </Button>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Set opening hours for each day. Add multiple time ranges for split schedules (e.g. lunch
            and dinner service).
          </p>

          <div className="space-y-4">
            {operatingHours.map((day, dayIndex) => (
              <div key={day.day} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="w-32 font-medium text-gray-900">{day.day}</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => handleDayOpenChange(dayIndex, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Open</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(dayIndex)}
                    disabled={!day.isOpen}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Time Range
                  </Button>
                </div>

                {day.isOpen ? (
                  <div className="space-y-2">
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slot.id} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            handleSlotChange(dayIndex, slotIndex, "startTime", e.target.value)
                          }
                          className="h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            handleSlotChange(dayIndex, slotIndex, "endTime", e.target.value)
                          }
                          className="h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {day.slots.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Closed</p>
                )}
              </div>
            ))}
          </div>

          <Button className="mt-4" onClick={saveOperatingHours}>
            Save Operating Hours
          </Button>
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
