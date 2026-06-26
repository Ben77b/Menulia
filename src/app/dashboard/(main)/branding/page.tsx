"use client";

import { useState, useEffect, useRef } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// Utility function to calculate brightness and determine text color
function getContrastColor(hexColor: string): string {
  // Remove hash if present
  const hex = hexColor.replace("#", "");
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate brightness using YIQ formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for light backgrounds, white for dark backgrounds
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

export default function BrandingPage() {
  const { currentRestaurant } = useRestaurant();

  const [color1, setColor1] = useState("#FFFFFF");
  const [color2, setColor2] = useState("#F3F4F6");
  const [color3, setColor3] = useState("#FFFFFF");
  const [matchMainBackground, setMatchMainBackground] = useState(false);
  const [loading, setLoading] = useState(true);

  // Font selection state
  const [selectedPreset, setSelectedPreset] = useState("minimalist-cafe");
  const [customHeadingFont, setCustomHeadingFont] = useState("");
  const [customBodyFont, setCustomBodyFont] = useState("");
  const headingFontInputRef = useRef<HTMLInputElement>(null);
  const bodyFontInputRef = useRef<HTMLInputElement>(null);

  // Safety timeout to force loading to false after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Forcing branding page loading to false due to timeout');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading]);


  // Font presets
  const fontPresets = [
    {
      id: "elegant-feast",
      name: "The Elegant Feast",
      headingFont: "Playfair Display",
      bodyFont: "Source Sans Pro",
    },
    {
      id: "minimalist-cafe",
      name: "The Minimalist Cafe",
      headingFont: "Inter",
      bodyFont: "Inter",
    },
    {
      id: "organic-bistro",
      name: "The Organic Bistro",
      headingFont: "Lora",
      bodyFont: "Open Sans",
    },
    {
      id: "bold-diner",
      name: "The Bold Diner",
      headingFont: "Montserrat",
      bodyFont: "Roboto",
    },
    {
      id: "trendy-eatery",
      name: "The Trendy Eatery",
      headingFont: "Space Grotesk",
      bodyFont: "DM Sans",
    },
    {
      id: "classic-pizzeria",
      name: "The Classic Pizzeria",
      headingFont: "Merriweather",
      bodyFont: "Lato",
    },
  ];

  // Load saved colors and fonts when restaurant changes
  useEffect(() => {
    if (currentRestaurant) {
      loadRestaurantData();
    }
  }, [currentRestaurant]);

  async function loadRestaurantData() {
    if (!currentRestaurant) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('theme_colors, typography')
        .eq('id', currentRestaurant.id)
        .single();

      if (error) throw error;

      if (data) {
        if (data.theme_colors) {
          setColor1(data.theme_colors.color1 || "#FFFFFF");
          setColor2(data.theme_colors.color2 || "#F3F4F6");
          setColor3(data.theme_colors.color3 || "#FFFFFF");
          setMatchMainBackground(data.theme_colors.matchMainBackground || false);
        }

        if (data.typography) {
          setSelectedPreset(data.typography.selectedPreset || "minimalist-cafe");
          setCustomHeadingFont(data.typography.customHeadingFont || "");
          setCustomBodyFont(data.typography.customBodyFont || "");
        }
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      // Fallback to localStorage if Supabase fails
      const saved = localStorage.getItem(`branding-colors-${currentRestaurant.id}`);
      if (saved) {
        const colors = JSON.parse(saved);
        setColor1(colors.color1 || "#FFFFFF");
        setColor2(colors.color2 || "#F3F4F6");
        setColor3(colors.color3 || "#FFFFFF");
        setMatchMainBackground(colors.matchMainBackground || false);
      }

      const savedFonts = localStorage.getItem(`branding-fonts-${currentRestaurant.id}`);
      if (savedFonts) {
        const fonts = JSON.parse(savedFonts);
        setSelectedPreset(fonts.selectedPreset || "minimalist-cafe");
        setCustomHeadingFont(fonts.customHeadingFont || "");
        setCustomBodyFont(fonts.customBodyFont || "");
      }
    } finally {
      setLoading(false);
    }
  }

  // Save colors and fonts when they change
  useEffect(() => {
    if (currentRestaurant) {
      saveRestaurantData();
    }
  }, [color1, color2, color3, matchMainBackground, selectedPreset, customHeadingFont, customBodyFont, currentRestaurant]);

  async function saveRestaurantData() {
    if (!currentRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          theme_colors: {
            color1,
            color2,
            color3,
            matchMainBackground,
          },
          typography: {
            selectedPreset,
            customHeadingFont,
            customBodyFont,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRestaurant.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving restaurant data:', error);
      // Fallback to localStorage if Supabase fails
      localStorage.setItem(`branding-colors-${currentRestaurant.id}`, JSON.stringify({
        color1,
        color2,
        color3,
        matchMainBackground,
      }));
      localStorage.setItem(`branding-fonts-${currentRestaurant.id}`, JSON.stringify({
        selectedPreset,
        customHeadingFont,
        customBodyFont,
      }));
    }
  }

  // Sync color2 with color3 when match is enabled
  useEffect(() => {
    if (matchMainBackground) {
      setColor2(color3);
    }
  }, [color3, matchMainBackground]);

  function handleColor1Change(value: string) {
    setColor1(value);
  }

  function handleColor2Change(value: string) {
    setColor2(value);
  }

  function handleColor3Change(value: string) {
    setColor3(value);
  }

  function handleMatchToggle(checked: boolean) {
    setMatchMainBackground(checked);
    if (checked) {
      setColor2(color3);
    }
  }

  function handleHeadingFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomHeadingFont(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleBodyFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBodyFont(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  if (!currentRestaurant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Branding & Design</h1>
        <p className="text-sm text-gray-600">Customize your menu's appearance</p>
      </div>

      {/* Single centered full-width container with sectioned cards */}
      <div className="space-y-6">
        {/* Section 1: Color Configuration Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Configuration</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Color inputs */}
            <div className="space-y-6">
              {/* Color 1: Wrapper Background */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wrapper Background
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Outer page layout, header, and footer of the public menu
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color1}
                    onChange={(e) => handleColor1Change(e.target.value)}
                    className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color1}
                    onChange={(e) => handleColor1Change(e.target.value)}
                    className="flex-1 h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              {/* Color 2: Category Navigation Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Navigation Bar
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Sticky category anchor link menu
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => handleColor2Change(e.target.value)}
                    disabled={matchMainBackground}
                    className={`h-12 w-12 rounded-lg border border-gray-200 cursor-pointer ${
                      matchMainBackground ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                  <input
                    type="text"
                    value={color2}
                    onChange={(e) => handleColor2Change(e.target.value)}
                    disabled={matchMainBackground}
                    className={`flex-1 h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      matchMainBackground ? "opacity-50 cursor-not-allowed bg-gray-50" : ""
                    }`}
                    placeholder="#F3F4F6"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="matchMainBackground"
                    checked={matchMainBackground}
                    onChange={(e) => handleMatchToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="matchMainBackground"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    Match main background color
                  </label>
                </div>
              </div>

              {/* Color 3: Main Canvas Background */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Canvas Background
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Inner section directly behind the food cards
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color3}
                    onChange={(e) => handleColor3Change(e.target.value)}
                    className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color3}
                    onChange={(e) => handleColor3Change(e.target.value)}
                    className="flex-1 h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Right: Contrast Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Contrast Preview</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="space-y-2">
                  <div
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: color1 }}
                  >
                    <span style={{ color: getContrastColor(color1) }}>
                      Wrapper Background
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: getContrastColor(color1) }}
                    >
                      {getContrastColor(color1)}
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: color2 }}
                  >
                    <span style={{ color: getContrastColor(color2) }}>
                      Category Bar
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: getContrastColor(color2) }}
                    >
                      {getContrastColor(color2)}
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: color3 }}
                  >
                    <span style={{ color: getContrastColor(color3) }}>
                      Main Canvas
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: getContrastColor(color3) }}
                    >
                      {getContrastColor(color3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Typography & Branding Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Typography</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Font Packs */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Font Packs</h3>
              <div className="space-y-3">
                {fontPresets.map((preset) => {
                  const currentPreset = fontPresets.find(p => p.id === selectedPreset);
                  const headingFont = currentPreset?.headingFont || "Inter";
                  const bodyFont = currentPreset?.bodyFont || "Inter";
                  
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        selectedPreset === preset.id
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 
                            className="font-medium text-gray-900"
                            style={{ fontFamily: preset.headingFont }}
                          >
                            {preset.name}
                          </h3>
                          <p 
                            className="text-sm text-gray-600 mt-2"
                            style={{ fontFamily: preset.bodyFont }}
                          >
                            The quick brown fox jumps over the lazy dog.
                          </p>
                        </div>
                        {selectedPreset === preset.id && (
                          <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center ml-3">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Custom Fonts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Fonts</h3>
              <div className="space-y-6">
                {/* Heading Font */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heading Font
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Applies to Titles, Categories, and Dish Names (.woff2 / .ttf)
                  </p>
                  <input
                    type="file"
                    ref={headingFontInputRef}
                    onChange={handleHeadingFontUpload}
                    accept=".woff2,.ttf"
                    className="hidden"
                  />
                  <button
                    onClick={() => headingFontInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {customHeadingFont ? "Font uploaded" : "Upload heading font"}
                    </span>
                  </button>
                  {customHeadingFont && (
                    <p className="text-xs text-gray-500 mt-2">
                      Font file uploaded successfully
                    </p>
                  )}
                </div>

                {/* Body Font */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Font
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Applies to Descriptions, Prices, and Tags (.woff2 / .ttf)
                  </p>
                  <input
                    type="file"
                    ref={bodyFontInputRef}
                    onChange={handleBodyFontUpload}
                    accept=".woff2,.ttf"
                    className="hidden"
                  />
                  <button
                    onClick={() => bodyFontInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {customBodyFont ? "Font uploaded" : "Upload body font"}
                    </span>
                  </button>
                  {customBodyFont && (
                    <p className="text-xs text-gray-500 mt-2">
                      Font file uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
