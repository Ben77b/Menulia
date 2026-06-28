"use client";

import { useRef, useState } from "react";
import { useDesign } from "@/contexts/design-context";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import { themeColorsFromDesign } from "@/lib/restaurant-design";
import { serializeMenuThemeColors } from "@/lib/theme-colors";
import { Button } from "@/components/ui/button";
import { RestaurantLogo, LOGO_ACCEPT } from "@/components/restaurant-logo";
import { Upload, Image as ImageIcon, X, Search } from "lucide-react";

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

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <span className="font-mono text-sm text-gray-600">{value}</span>
      </div>
    </div>
  );
}

export function BrandingDashboard() {
  const { design, updateDesign } = useDesign();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showTitleFontDropdown, setShowTitleFontDropdown] = useState(false);
  const [showBodyFontDropdown, setShowBodyFontDropdown] = useState(false);
  const [titleFontSearch, setTitleFontSearch] = useState("");
  const [bodyFontSearch, setBodyFontSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateDesign({ logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    if (!currentRestaurant?.id) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          logo: design.logo,
          meta_title: design.metaTitle,
          meta_description: design.metaDescription,
          theme_colors: serializeMenuThemeColors(themeColorsFromDesign(design)),
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

  const selectedTitleFont =
    GOOGLE_FONTS.find((f) => f.value === design.titleFont) || GOOGLE_FONTS[0];
  const selectedBodyFont =
    GOOGLE_FONTS.find((f) => f.value === design.textFont) || GOOGLE_FONTS[0];

  const filteredTitleFonts = GOOGLE_FONTS.filter((font) =>
    font.label.toLowerCase().includes(titleFontSearch.toLowerCase())
  );
  const filteredBodyFonts = GOOGLE_FONTS.filter((font) =>
    font.label.toLowerCase().includes(bodyFontSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="mt-1 text-sm text-gray-600">
            Logo, colors, fonts, and SEO for your public menu
          </p>
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

      <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Logo & SEO</h2>

        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">Restaurant Logo</label>
          <div className="flex flex-col items-center gap-4">
            {design.logo ? (
              <div className="relative">
                <RestaurantLogo
                  src={design.logo}
                  alt="Restaurant Logo"
                  wrapperClassName="h-32 w-32 rounded-xl border border-gray-100 bg-gray-50 p-3"
                  className="h-full w-full"
                />
                <button
                  type="button"
                  onClick={() => updateDesign({ logo: "" })}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              className="w-full max-w-xs gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Logo
            </Button>
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_ACCEPT}
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Meta Title (SEO)</label>
          <input
            type="text"
            placeholder="e.g., Best Pizza in New York - Restaurant Name"
            value={design.metaTitle}
            onChange={(e) => updateDesign({ metaTitle: e.target.value })}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended: 50–60 characters</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Meta Description (SEO)
          </label>
          <textarea
            placeholder="e.g., Authentic Italian pizza made with fresh ingredients."
            value={design.metaDescription}
            onChange={(e) => updateDesign({ metaDescription: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended: 150–160 characters</p>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Color Palette</h2>
        <p className="text-sm text-gray-600">
          Text and icons automatically adjust to black or white for maximum contrast on each section.
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ColorPicker
            label="Header Background"
            value={design.headerBackgroundColor}
            onChange={(v) => updateDesign({ headerBackgroundColor: v })}
          />
          <ColorPicker
            label="Categories Strip Background"
            value={design.categoryStripBackgroundColor}
            onChange={(v) => updateDesign({ categoryStripBackgroundColor: v })}
          />
          <ColorPicker
            label="Active Category Accent Color"
            value={design.categoryAccentColor}
            onChange={(v) => updateDesign({ categoryAccentColor: v })}
          />
          <ColorPicker
            label="Main Content Background (Dish area)"
            value={design.mainContentBackgroundColor}
            onChange={(v) => updateDesign({ mainContentBackgroundColor: v })}
          />
          <ColorPicker
            label="Footer Background"
            value={design.footerBackgroundColor}
            onChange={(v) => updateDesign({ footerBackgroundColor: v })}
          />
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Typography</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Title Font</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fonts..."
                value={titleFontSearch}
                onChange={(e) => setTitleFontSearch(e.target.value)}
                onFocus={() => setShowTitleFontDropdown(true)}
                className="h-12 w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {showTitleFontDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTitleFontDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
                    {filteredTitleFonts.map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => {
                          updateDesign({ titleFont: font.value });
                          setShowTitleFontDropdown(false);
                          setTitleFontSearch("");
                        }}
                        className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm hover:bg-gray-50 ${font.className}`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">Selected: {selectedTitleFont.label}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Body Font</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fonts..."
                value={bodyFontSearch}
                onChange={(e) => setBodyFontSearch(e.target.value)}
                onFocus={() => setShowBodyFontDropdown(true)}
                className="h-12 w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {showBodyFontDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowBodyFontDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
                    {filteredBodyFonts.map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => {
                          updateDesign({ textFont: font.value });
                          setShowBodyFontDropdown(false);
                          setBodyFontSearch("");
                        }}
                        className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm hover:bg-gray-50 ${font.className}`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">Selected: {selectedBodyFont.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
