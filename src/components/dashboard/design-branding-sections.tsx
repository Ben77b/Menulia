"use client";

import { useRef, useState } from "react";
import { Upload, Image as ImageIcon, X, Search } from "lucide-react";
import { useDesign } from "@/contexts/design-context";
import { normalizeHexColor } from "@/lib/theme-colors";
import { Button } from "@/components/ui/button";
import type { FontStyle, FontWeight } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import { TYPOGRAPHY_PRESETS, typographyPresetToDesignPatch, resolveCategoryTypography } from "@/lib/typography";
import { ChevronDown } from "lucide-react";
import { RestaurantLogo, LOGO_ACCEPT } from "@/components/restaurant-logo";

export const GOOGLE_FONTS = [
  { label: "Cormorant Garamond", value: "Cormorant Garamond", className: "font-[var(--font-cormorant-garamond)]" },
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

function FontModifierControls({
  label,
  weight,
  style,
  onWeightChange,
  onStyleChange,
}: {
  label: string;
  weight: FontWeight;
  style: FontStyle;
  onWeightChange: (weight: FontWeight) => void;
  onStyleChange: (style: FontStyle) => void;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-600">{label} modifiers</p>
      <div>
        <p className="mb-2 text-xs text-gray-500">Weight</p>
        <div className="flex gap-2">
          {([400, 700] as FontWeight[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onWeightChange(value)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                weight === value
                  ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              {value === 400 ? "Regular (400)" : "Bold (700)"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-gray-500">Style</p>
        <div className="flex gap-2">
          {(["normal", "italic"] as FontStyle[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onStyleChange(value)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                style === value
                  ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                value === "italic" && "italic"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesignDisplaySection() {
  const { design, updateDesign } = useDesign();

  return (
    <div className="space-y-1">
      <p className="mb-4 text-sm text-gray-600">
        Control what guests see on your public menu.
      </p>
      <ToggleSwitch
        label="Show Prices"
        checked={design.showPrices ?? true}
        onChange={(checked) => updateDesign({ showPrices: checked })}
      />
      <ToggleSwitch
        label="Show Descriptions"
        checked={design.showDescriptions ?? true}
        onChange={(checked) => updateDesign({ showDescriptions: checked })}
      />
      <ToggleSwitch
        label="Show Images"
        checked={design.showImages ?? true}
        onChange={(checked) => updateDesign({ showImages: checked })}
      />
      <ToggleSwitch
        label="Show Dietary Info"
        checked={design.showDietary ?? true}
        onChange={(checked) => updateDesign({ showDietary: checked })}
      />
    </div>
  );
}

function SectionColorPicker({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const safeValue = normalizeHexColor(value, fallback);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <span className="font-mono text-xs text-gray-600">{safeValue}</span>
      </div>
    </div>
  );
}

export function DesignCategoryStylingSection() {
  const { getColorValue, setColorValue } = useDesign();

  return (
    <div className="border-t border-gray-100 pt-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Category Styling
      </h2>
      <p className="mb-4 text-xs text-gray-500">
        Category navigation strip and active pill accent.
      </p>
      <div className="space-y-4">
        <SectionColorPicker
          label="Categories Strip Background"
          value={getColorValue("categoryStripBackgroundColor")}
          fallback="#f3f4f6"
          onChange={(v) => setColorValue("categoryStripBackgroundColor", v)}
        />
        <SectionColorPicker
          label="Active Category Accent Color"
          value={getColorValue("categoryAccentColor")}
          fallback="#047857"
          onChange={(v) => setColorValue("categoryAccentColor", v)}
        />
      </div>
    </div>
  );
}

export function DesignLogoSeoSection({ showHeading = true }: { showHeading?: boolean }) {
  const { design, updateDesign } = useDesign();
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateDesign({ logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={showHeading ? "border-t border-gray-100 pt-6" : ""}>
      {showHeading && (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Logo & SEO
        </h2>
      )}

      <div className="mb-5">
        <label className="mb-3 block text-sm font-medium text-gray-700">Restaurant Logo</label>
        <div className="flex flex-col items-center gap-3">
          {design.logo ? (
            <div className="relative">
              <RestaurantLogo
                src={design.logo}
                alt="Restaurant Logo"
                wrapperClassName="h-24 w-24 rounded-xl border border-gray-100 bg-gray-50 p-2"
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
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
              <ImageIcon className="h-7 w-7 text-gray-400" />
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => logoInputRef.current?.click()}
            className="w-full gap-2"
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

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Meta Title (SEO)</label>
        <input
          type="text"
          placeholder="e.g., Best Pizza in New York"
          value={design.metaTitle ?? ""}
          onChange={(e) => updateDesign({ metaTitle: e.target.value })}
          className="h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Recommended: 50–60 characters</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Meta Description (SEO)</label>
        <textarea
          placeholder="e.g., Authentic Italian pizza made with fresh ingredients."
          value={design.metaDescription ?? ""}
          onChange={(e) => updateDesign({ metaDescription: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Recommended: 150–160 characters</p>
      </div>
    </div>
  );
}

export function DesignTypographySection({ showHeading = true }: { showHeading?: boolean }) {
  const { design, updateDesign } = useDesign();
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const [showTitleFontDropdown, setShowTitleFontDropdown] = useState(false);
  const [showCategoryFontDropdown, setShowCategoryFontDropdown] = useState(false);
  const [showBodyFontDropdown, setShowBodyFontDropdown] = useState(false);
  const [titleFontSearch, setTitleFontSearch] = useState("");
  const [categoryFontSearch, setCategoryFontSearch] = useState("");
  const [bodyFontSearch, setBodyFontSearch] = useState("");

  const resolvedCategory = resolveCategoryTypography(design);
  const activePresetId =
    TYPOGRAPHY_PRESETS.find(
      (preset) =>
        preset.titleFont === design.titleFont &&
        preset.textFont === design.textFont &&
        preset.titleFontWeight === design.titleFontWeight &&
        preset.textFontWeight === design.textFontWeight &&
        preset.titleFontStyle === design.titleFontStyle &&
        preset.textFontStyle === design.textFontStyle
    )?.id ?? null;

  const selectedTitleFont =
    GOOGLE_FONTS.find((f) => f.value === design.titleFont) || GOOGLE_FONTS[0];
  const selectedCategoryFont =
    GOOGLE_FONTS.find((f) => f.value === resolvedCategory.categoryFont) || GOOGLE_FONTS[0];
  const selectedBodyFont =
    GOOGLE_FONTS.find((f) => f.value === design.textFont) || GOOGLE_FONTS[0];

  const filteredTitleFonts = GOOGLE_FONTS.filter((font) =>
    font.label.toLowerCase().includes(titleFontSearch.toLowerCase())
  );
  const filteredCategoryFonts = GOOGLE_FONTS.filter((font) =>
    font.label.toLowerCase().includes(categoryFontSearch.toLowerCase())
  );
  const filteredBodyFonts = GOOGLE_FONTS.filter((font) =>
    font.label.toLowerCase().includes(bodyFontSearch.toLowerCase())
  );

  return (
    <div className={showHeading ? "border-t border-gray-100 pt-6" : ""}>
      {showHeading && (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Typography
        </h2>
      )}

      <div className="mb-6">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Design Archetypes</h3>
        <p className="mb-4 text-sm text-gray-600">
          Pick a curated pairing — one click sets title and body fonts.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPOGRAPHY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => updateDesign(typographyPresetToDesignPatch(preset))}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                activePresetId === preset.id
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <p className="text-sm font-semibold text-gray-900">{preset.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{preset.description}</p>
              <div className="mt-3 space-y-1 rounded-lg bg-gray-50 px-3 py-2">
                <p className={cn("text-base leading-tight text-gray-900", preset.previewTitleClass)}>
                  Menu Title
                </p>
                <p className={cn("text-sm text-gray-600", preset.previewBodyClass)}>
                  Fresh seasonal dishes
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setFineTuneOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Fine-tune Typography
          <ChevronDown
            className={cn("h-4 w-4 text-gray-500 transition-transform", fineTuneOpen && "rotate-180")}
          />
        </button>

        {fineTuneOpen && (
          <div className="mt-4 space-y-5">
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
                  className="h-11 w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {showTitleFontDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowTitleFontDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
                      {filteredTitleFonts.map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() => {
                            updateDesign({ titleFont: font.value });
                            setShowTitleFontDropdown(false);
                            setTitleFontSearch("");
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${font.className}`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-600">Selected: {selectedTitleFont.label}</p>
              <FontModifierControls
                label="Title"
                weight={design.titleFontWeight}
                style={design.titleFontStyle}
                onWeightChange={(titleFontWeight) => updateDesign({ titleFontWeight })}
                onStyleChange={(titleFontStyle) => updateDesign({ titleFontStyle })}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-gray-700">Category Font</label>
                {design.categoryFontLinkedToTitle && (
                  <span className="text-xs text-indigo-600">Linked to title font</span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fonts..."
                  value={categoryFontSearch}
                  onChange={(e) => setCategoryFontSearch(e.target.value)}
                  onFocus={() => setShowCategoryFontDropdown(true)}
                  className="h-11 w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {showCategoryFontDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowCategoryFontDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
                      {filteredCategoryFonts.map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() => {
                            updateDesign({
                              categoryFont: font.value,
                              categoryFontLinkedToTitle: false,
                              categoryFontWeight: resolvedCategory.categoryFontWeight,
                              categoryFontStyle: resolvedCategory.categoryFontStyle,
                            });
                            setShowCategoryFontDropdown(false);
                            setCategoryFontSearch("");
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${font.className}`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-600">Selected: {selectedCategoryFont.label}</p>
              <FontModifierControls
                label="Category"
                weight={resolvedCategory.categoryFontWeight}
                style={resolvedCategory.categoryFontStyle}
                onWeightChange={(categoryFontWeight) =>
                  updateDesign({
                    categoryFont: resolvedCategory.categoryFont,
                    categoryFontWeight,
                    categoryFontStyle: resolvedCategory.categoryFontStyle,
                    categoryFontLinkedToTitle: false,
                  })
                }
                onStyleChange={(categoryFontStyle) =>
                  updateDesign({
                    categoryFont: resolvedCategory.categoryFont,
                    categoryFontWeight: resolvedCategory.categoryFontWeight,
                    categoryFontStyle,
                    categoryFontLinkedToTitle: false,
                  })
                }
              />
              {design.categoryFontLinkedToTitle && (
                <p className="mt-2 text-xs text-gray-500">
                  Category headings use the title font until you pick a different category font
                  above.
                </p>
              )}
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
                  className="h-11 w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {showBodyFontDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowBodyFontDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
                      {filteredBodyFonts.map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() => {
                            updateDesign({ textFont: font.value });
                            setShowBodyFontDropdown(false);
                            setBodyFontSearch("");
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${font.className}`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-600">Selected: {selectedBodyFont.label}</p>
              <FontModifierControls
                label="Body"
                weight={design.textFontWeight}
                style={design.textFontStyle}
                onWeightChange={(textFontWeight) => updateDesign({ textFontWeight })}
                onStyleChange={(textFontStyle) => updateDesign({ textFontStyle })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
