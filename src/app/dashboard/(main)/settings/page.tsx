"use client";

import { useState, useEffect } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Clock, Users, Link2, Trash2, Plus } from "lucide-react";

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
  const { currentRestaurant } = useRestaurant();
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([
    { day: "Monday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Tuesday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Wednesday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Thursday", isOpen: true, startTime: "09:00", endTime: "22:00" },
    { day: "Friday", isOpen: true, startTime: "09:00", endTime: "23:00" },
    { day: "Saturday", isOpen: true, startTime: "10:00", endTime: "23:00" },
    { day: "Sunday", isOpen: true, startTime: "10:00", endTime: "21:00" },
  ]);
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [footerSlogan, setFooterSlogan] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentRestaurant) {
      loadRestaurantData();
    }
  }, [currentRestaurant]);

  async function loadRestaurantData() {
    if (!currentRestaurant) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('operating_hours, max_capacity, custom_links, footer_slogan')
        .eq('id', currentRestaurant.id)
        .single();

      if (error) throw error;

      if (data) {
        if (data.operating_hours) {
          setOperatingHours(data.operating_hours);
        }
        if (data.max_capacity) {
          setMaxCapacity(data.max_capacity);
        }
        if (data.custom_links) {
          setCustomLinks(data.custom_links);
        }
        if (data.footer_slogan) {
          setFooterSlogan(data.footer_slogan || "");
        }
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      setLoading(false);
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

  async function saveMaxCapacity() {
    if (!currentRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ max_capacity: maxCapacity, updated_at: new Date().toISOString() })
        .eq('id', currentRestaurant.id);

      if (error) throw error;
      alert("Max capacity saved!");
    } catch (error) {
      console.error('Error saving max capacity:', error);
      alert("Failed to save max capacity");
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

  if (loading) return <div>Loading...</div>;
  if (!currentRestaurant) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your restaurant operations and settings</p>
      </div>

      <div className="space-y-6">
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

        {/* Reservation Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Reservation Settings</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Configure your restaurant's capacity for reservations</p>
          
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Capacity per Time Slot
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Maximum total seats/covers the restaurant can accept every 30 or 60 minutes
            </p>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          
          <Button className="mt-4" onClick={saveMaxCapacity}>Save Capacity Settings</Button>
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
      </div>
    </div>
  );
}
