"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Clock, Link2, Trash2, Plus, Building2, Mail, Globe, QrCode, Download } from "lucide-react";
import QRCode from "react-qr-code";

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
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [footerSlogan, setFooterSlogan] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const slugRegex = useMemo(() => /^[a-z0-9-]+$/, []);

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
        .select('operating_hours, custom_links, footer_slogan, name, email, slug')
        .eq('id', currentRestaurant.id)
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
        if (data.email) {
          setRestaurantEmail(data.email || "");
        }
        if (data.slug) {
          setRestaurantSlug(data.slug);
        }
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
        .from('restaurants')
        .update({
          name: restaurantName,
          email: restaurantEmail,
          slug: restaurantSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRestaurant.id);

      if (error) throw error;
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

  function downloadQRCode() {
    if (!restaurantSlug || !qrCodeRef.current) return;

    const svg = qrCodeRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size for high resolution (512x512)
      canvas.width = 512;
      canvas.height = 512;
      
      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code scaled to canvas size
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to PNG and download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${restaurantSlug}-menu-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }

  if (!currentRestaurant) return <div>Loading...</div>;

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={restaurantEmail}
                onChange={(e) => setRestaurantEmail(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="contact@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">menulia.net/</span>
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

        {/* Table QR Code */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Table QR Code</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Generate a QR code for customers to scan and view your menu on their phones.
          </p>
          
          {!restaurantSlug ? (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-600 text-center">
                Please set a URL slug in settings to generate your QR code.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div 
                ref={qrCodeRef}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <QRCode
                  value={`https://menulia.net/${restaurantSlug}`}
                  size={200}
                  level="H"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Scan to view menu at menulia.net/{restaurantSlug}
                </p>
                <Button onClick={downloadQRCode} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
}
