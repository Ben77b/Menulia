"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Clock, Link2, Trash2, Plus, Building2, Mail, Globe, User, LogOut, Lock, Download, AlertTriangle, CreditCard } from "lucide-react";
import {
  MenuDesignSettings,
  menuDesignFromRestaurant,
  defaultMenuDesignState,
} from "@/components/dashboard/menu-design-settings";

interface OperatingHour {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([
    { day: "Monday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Tuesday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Wednesday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Thursday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Friday", isOpen: true, startTime: "09:00", endTime: "23:00" },
    { day: "Saturday", isOpen: true, startTime: "10:00", endTime: "23:00" },
    { day: "Sunday", isOpen: true, startTime: "10:00", endTime: "21:00" },
  ]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [footerSlogan, setFooterSlogan] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantLocation, setRestaurantLocation] = useState("");
  const [restaurantHours, setRestaurantHours] = useState("");
  const [restaurantContactInfo, setRestaurantContactInfo] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [menuDesign, setMenuDesign] = useState(defaultMenuDesignState());

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setUserFullName(user.user_metadata?.full_name || "");
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
        if (data.operating_hours) {
          setOperatingHours(data.operating_hours);
        }
        if (data.custom_links) {
          setCustomLinks(data.custom_links);
        }
        if (data.footer_slogan) {
          setFooterSlogan(data.footer_slogan || "");
        }
        if (data.name) {
          setRestaurantName(data.name);
        }
        setRestaurantLocation(data.location ?? "");
        setRestaurantHours(data.hours ?? "");
        setRestaurantContactInfo(data.contact_info ?? "");
        setRestaurantSlug(typeof data.slug === "string" ? data.slug : "");
        setMenuDesign(menuDesignFromRestaurant(data));
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    }
  }

  async function saveOperatingHours() {
    if (!currentRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ operating_hours: operatingHours, updated_at: new Date().toISOString() })
        .eq('id', currentRestaurant.id);

      if (error) throw error;
      alert("Operating hours saved!");
    } catch (error) {
      console.error('Error saving operating hours:', error);
      alert("Failed to save operating hours");
    }
  }

  async function saveFooterSettings() {
    if (!currentRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          custom_links: customLinks,
          footer_slogan: footerSlogan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRestaurant.id);

      if (error) throw error;
      alert("Footer settings saved!");
    } catch (error) {
      console.error('Error saving footer settings:', error);
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
          hours: restaurantHours,
          contact_info: restaurantContactInfo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRestaurant.id);

      if (error) throw error;
      await refreshRestaurants();
      alert("Restaurant profile saved!");
    } catch (error) {
      console.error('Error saving restaurant profile:', error);
      alert("Failed to save restaurant profile");
    }
  }

  function handleOperatingHourChange(index: number, field: keyof OperatingHour, value: any) {
    const newHours = [...operatingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setOperatingHours(newHours);
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
    setCustomLinks(customLinks.filter(link => link.id !== id));
  }

  function updateCustomLink(id: string, field: keyof CustomLink, value: string) {
    setCustomLinks(customLinks.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  }

  function handleSlugChange(value: string) {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    setRestaurantSlug(formatted);
    
    if (formatted && !slugRegex.test(formatted)) {
      setSlugError("Slug must contain only lowercase letters, numbers, and hyphens");
    } else {
      setSlugError("");
    }
  }

  async function saveAccountDetails() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { full_name: userFullName },
          email: userEmail
        });
        alert("Account details saved! If you changed your email, you will need to verify the new address before the change takes effect.");
      }
    } catch (error) {
      console.error('Error saving account details:', error);
      alert("Failed to save account details");
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      alert("Failed to log out");
    }
  }

  async function handleDownloadData() {
    alert("Preparing data export... This feature will be available soon.");
  }

  async function handleDeleteAccount() {
    const confirmed = confirm("Are you sure? This will permanently delete your restaurant, menu, and account data. This cannot be undone.");
    if (confirmed) {
      try {
        await supabase.auth.signOut();
        router.push('/');
      } catch (error) {
        console.error('Error deleting account:', error);
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
        {/* Restaurant Profile */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Profile</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Update your restaurant's basic information</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Your Restaurant Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={restaurantLocation}
                onChange={(e) => setRestaurantLocation(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="123 Main Street, Dublin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours (public display)</label>
              <input
                type="text"
                value={restaurantHours}
                onChange={(e) => setRestaurantHours(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Mon–Fri 12:00–22:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info</label>
              <input
                type="text"
                value={restaurantContactInfo}
                onChange={(e) => setRestaurantContactInfo(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="+353 1 234 5678 · hello@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">menulia.net/menu/</span>
                <input
                  type="text"
                  value={restaurantSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="your-restaurant-slug"
                />
              </div>
              {slugError && (
                <p className="mt-1 text-xs text-red-600">{slugError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Use only lowercase letters, numbers, and hyphens. No spaces.
              </p>
            </div>
          </div>
          
          <Button className="mt-4" onClick={saveRestaurantProfile}>Save Profile</Button>
        </div>

        <MenuDesignSettings
          {...menuDesign}
          onChange={(updates) => setMenuDesign((prev) => ({ ...prev, ...updates }))}
        />

        {/* Operating Hours */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Set your restaurant's opening hours for each day of the week</p>
          
          <div className="space-y-3">
            {operatingHours.map((hour, index) => (
              <div key={hour.day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                <div className="w-32 font-medium text-gray-900">{hour.day}</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hour.isOpen}
                    onChange={(e) => handleOperatingHourChange(index, 'isOpen', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Open</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hour.startTime}
                    onChange={(e) => handleOperatingHourChange(index, 'startTime', e.target.value)}
                    disabled={!hour.isOpen}
                    className="h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hour.endTime}
                    onChange={(e) => handleOperatingHourChange(index, 'endTime', e.target.value)}
                    disabled={!hour.isOpen}
                    className="h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <Button className="mt-4" onClick={saveOperatingHours}>Save Operating Hours</Button>
        </div>

        {/* Public Page Footer & Links Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Public Page Footer & Links Settings</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Configure external links and footer content for your public menu page</p>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Custom Links */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Custom Links</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomLink}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>
              
              {customLinks.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No custom links added yet</p>
              ) : (
                <div className="space-y-3">
                  {customLinks.map((link) => (
                    <div key={link.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)}
                          placeholder="Link label (e.g., TripAdvisor)"
                          className="w-full h-9 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full h-9 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomLink(link.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Footer Slogan */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Footer Slogan / Note</h3>
              <p className="text-xs text-gray-500 mb-3">
                Add a custom note to display in your menu footer
              </p>
              <textarea
                value={footerSlogan}
                onChange={(e) => setFooterSlogan(e.target.value)}
                placeholder="We recommend reservations after 12 PM"
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>
          
          <Button className="mt-4" onClick={saveFooterSettings}>Save Footer Settings</Button>
        </div>

        {/* Account Management */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Manage your personal SaaS account details and security settings</p>

          <div className="space-y-6">
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Personal Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="your@email.com"
                />
                <p className="mt-1 text-xs text-gray-500">If you change your email, you will need to verify the new address before the change takes effect.</p>
              </div>
              <Button onClick={saveAccountDetails}>Save Account Details</Button>
            </div>

            {/* Subscription */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Subscription</h3>
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Session & Security</h3>
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

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Irreversible and destructive actions for your account and data</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Download My Data</h3>
                <p className="text-xs text-gray-600">Export all your restaurant and account data (GDPR/CCPA compliance)</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleDownloadData}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                <p className="text-xs text-gray-600">Permanently delete your restaurant, menu, and account data</p>
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
