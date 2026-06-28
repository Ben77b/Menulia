"use client";

import { useRef, useState } from "react";
import { useDesign } from "@/contexts/design-context";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X, Search, FileUp } from "lucide-react";

const GOOGLE_FONTS = [
  { label: "Inter", value: "Inter", className: "font-[var(--font-inter)]" },
  { label: "Montserrat", value: "Montserrat", className: "font-[var(--font-montserrat)]" },
  { label: "Playfair Display", value: "Playfair Display", className: "font-[var(--font-playfair-display)]" },
  { label: "Poppins", value: "Poppins", className: "font-[var(--font-poppins)]" },
  { label: "Roboto", value: "Roboto", className: "font-[var(--font-roboto)]" },
  { label: "Open Sans", value: "Open Sans", className: "font-[var(--font-open-sans)]" },
  { label: "Lato", value: "Lato", className: "font-[var(--font-lato)]" },
  { label: "Merriweather", value: "Merriweather", className: "font-[var(--font-merriweather)]" },
  { label: "Oswald", value: "Oswald", className: "font-[var(--font-oswald)]" },
  { label: "Raleway", value: "Raleway", className: "font-[var(--font-raleway)]" },
  { label: "Source Sans Pro", value: "Source Sans Pro", className: "font-[var(--font-source-sans)]" },
  { label: "Ubuntu", value: "Ubuntu", className: "font-[var(--font-ubuntu)]" },
];

export function BrandingDashboard() {
  const { design, updateDesign } = useDesign();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateDesign({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateDesign({ customFont: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  };

  const handleFontUploadClick = () => {
    fontInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    updateDesign({ logo: "" });
  };

  const handleRemoveCustomFont = () => {
    updateDesign({ customFont: "" });
  };

  const handleSaveChanges = async () => {
    if (!currentRestaurant?.id) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: design.restaurantName,
          logo: design.logo,
          location: design.location,
          hours: design.hours,
          contact_info: design.contactInfo,
          meta_title: design.metaTitle,
          meta_description: design.metaDescription,
          theme_colors: {
            headerFooterBackgroundColor: design.headerFooterBackgroundColor,
            categoryBackgroundColor: design.categoryBackgroundColor,
            mainContentBackgroundColor: design.mainContentBackgroundColor,
            headerFooterFontColor: design.headerFooterFontColor,
            categoryFontColor: design.categoryFontColor,
          },
          typography: {
            titleFont: design.titleFont,
            textFont: design.textFont,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRestaurant.id);

      if (error) throw error;

      await refreshRestaurants();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving branding:", error);
      setSaveError(formatSupabaseError(error));
    } finally {
      setSaving(false);
    }
  };

  const selectedFont = GOOGLE_FONTS.find((f) => f.value === design.titleFont) || GOOGLE_FONTS[0];

  const filteredFonts = GOOGLE_FONTS.filter((font) =>
    font.label.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding & Design</h1>
          <p className="mt-1 text-sm text-gray-600">Customize your restaurant&apos;s visual identity</p>
        </div>
        <Button
          size="lg"
          className="px-8"
          onClick={handleSaveChanges}
          disabled={saving || !currentRestaurant?.id}
        >
          {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Section 1: Brand Identity */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Brand Identity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700">Restaurant Logo</label>
            <div className="flex flex-col items-center gap-4">
              {design.logo ? (
                <div className="relative">
                  <img
                    src={design.logo}
                    alt="Restaurant Logo"
                    className="w-32 h-32 object-contain rounded-xl border border-gray-100 p-3 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogoUploadClick}
                className="gap-2 w-full"
              >
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Column: Restaurant Info */}
          <div className="space-y-6">
            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Restaurant Name</label>
              <input
                type="text"
                placeholder="e.g., Bella Italia"
                value={design.restaurantName}
                onChange={(e) => updateDesign({ restaurantName: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Meta Title (SEO)</label>
              <input
                type="text"
                placeholder="e.g., Best Pizza in New York - Restaurant Name"
                value={design.metaTitle}
                onChange={(e) => updateDesign({ metaTitle: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Appears in search engine results (recommended: 50-60 characters)</p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Meta Description (SEO)</label>
              <textarea
                placeholder="e.g., Authentic Italian pizza made with fresh ingredients. Order online for delivery or pickup."
                value={design.metaDescription}
                onChange={(e) => updateDesign({ metaDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">Appears in search engine results (recommended: 150-160 characters)</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Location</label>
              <input
                type="text"
                placeholder="e.g., 123 Main Street, Dublin"
                value={design.location}
                onChange={(e) => updateDesign({ location: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Hours</label>
              <input
                type="text"
                placeholder="e.g., Mon–Fri 12:00–22:00, Sat–Sun 10:00–23:00"
                value={design.hours}
                onChange={(e) => updateDesign({ hours: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Contact Info</label>
              <input
                type="text"
                placeholder="e.g., +353 1 234 5678 · hello@restaurant.com"
                value={design.contactInfo}
                onChange={(e) => updateDesign({ contactInfo: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Color Palette */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Color Palette</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Backgrounds */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Backgrounds</h3>
            
            {/* Header, Footer & Page Background */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Header, Footer & Page Background</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <input
                    type="color"
                    value={design.headerFooterBackgroundColor}
                    onChange={(e) => updateDesign({ headerFooterBackgroundColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{design.headerFooterBackgroundColor}</span>
              </div>
            </div>

            {/* Category Section Background */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Category Section Background</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <input
                    type="color"
                    value={design.categoryBackgroundColor}
                    onChange={(e) => updateDesign({ categoryBackgroundColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{design.categoryBackgroundColor}</span>
              </div>
            </div>

            {/* Main Dish Section Background */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Main Dish Section Background</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <input
                    type="color"
                    value={design.mainContentBackgroundColor}
                    onChange={(e) => updateDesign({ mainContentBackgroundColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{design.mainContentBackgroundColor}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Text Colors */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Text Colors</h3>
            
            {/* Header/Footer Text Color */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Header/Footer Text Color</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <input
                    type="color"
                    value={design.headerFooterFontColor}
                    onChange={(e) => updateDesign({ headerFooterFontColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{design.headerFooterFontColor}</span>
              </div>
            </div>

            {/* Category Text Color */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Category Text Color</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <input
                    type="color"
                    value={design.categoryFontColor}
                    onChange={(e) => updateDesign({ categoryFontColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{design.categoryFontColor}</span>
              </div>
            </div>

            {/* Main Section Text Color */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Main Section Text Color</label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <input
                    type="color"
                    value={design.mainContentFontColor}
                    onChange={(e) => updateDesign({ mainContentFontColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{design.mainContentFontColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Typography */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Typography</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Font Selection */}
          <div className="space-y-6">
            {/* Searchable Font Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Google Font</label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fonts..."
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    onFocus={() => setShowFontDropdown(true)}
                    className="w-full h-12 pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                {showFontDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFontDropdown(false)} />
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-1 shadow-xl max-h-60 overflow-y-auto">
                      {filteredFonts.map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() => {
                            updateDesign({ titleFont: font.value, textFont: font.value });
                            setShowFontDropdown(false);
                            setFontSearch("");
                          }}
                          className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm hover:bg-gray-50 ${font.className}`}
                        >
                          <span>{font.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">Selected: {selectedFont.label}</p>
            </div>

            {/* Custom Font Upload */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-700">Custom Font (.woff2 or .ttf)</label>
              <div className="flex flex-col items-center gap-4">
                {design.customFont ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-xl border border-gray-100 p-4 bg-gray-50 flex items-center justify-center">
                      <FileUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCustomFont}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <FileUp className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFontUploadClick}
                  className="gap-2 w-full"
                >
                  <Upload className="h-4 w-4" />
                  Upload Custom Font
                </Button>
                <input
                  ref={fontInputRef}
                  type="file"
                  accept=".woff2,.ttf"
                  onChange={handleFontUpload}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Custom fonts override Google Font selection</p>
            </div>
          </div>

          {/* Right Column: Preview Card */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Preview</label>
            <div
              className={`p-6 rounded-lg border border-gray-200 ${selectedFont.className}`}
              style={{
                backgroundColor: design.mainContentBackgroundColor
              }}
            >
              {/* Header Preview */}
              <div
                className="p-4 rounded-lg mb-4"
                style={{
                  backgroundColor: design.headerFooterBackgroundColor,
                  color: design.headerFooterFontColor
                }}
              >
                <h3 className="text-xl font-bold">{design.restaurantName || "Restaurant Name"}</h3>
              </div>

              {/* Category Preview */}
              <div
                className="p-3 rounded-lg mb-4"
                style={{
                  backgroundColor: design.categoryBackgroundColor,
                  color: design.categoryFontColor
                }}
              >
                <span className="font-medium">Categories</span>
              </div>

              {/* Main Content Preview */}
              <div style={{ color: design.mainContentFontColor }}>
                <h3 className="text-2xl font-bold mb-2">Margherita Pizza</h3>
                <p className="text-sm mb-4">Fresh tomatoes, mozzarella, and basil on our classic crust</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm">Price</span>
                  <span className="font-bold text-lg">€12.99</span>
                </div>
                <button
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: design.buttonColor }}
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
