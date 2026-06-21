"use client";

import { useState, useEffect } from "react";
import {
  loadDesign,
  saveDesign,
  DEFAULT_DESIGN,
  type RestaurantDesign,
} from "@/lib/restaurant-design";
import { Button } from "@/components/ui/button";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { Upload } from "lucide-react";

interface DesignSettingsProps {
  restaurantId: string;
}

export function DesignSettings({ restaurantId }: DesignSettingsProps) {
  const [design, setDesign] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [saved, setSaved] = useState(false);
  const [visibleLanguages, setVisibleLanguages] = useState<Set<LanguageCode>>(new Set(["en"]));

  useEffect(() => {
    setDesign(loadDesign(restaurantId, true));
    // Load saved language preferences from localStorage
    const saved = localStorage.getItem(`visible-languages-${restaurantId}`);
    if (saved) {
      setVisibleLanguages(new Set(JSON.parse(saved)));
    }
  }, [restaurantId]);

  function handleSave() {
    saveDesign(restaurantId, design);
    // Dispatch event to notify parent component to save to restaurant object
    window.dispatchEvent(new CustomEvent('design-saved', { detail: design }));
    // Save language preferences
    localStorage.setItem(`visible-languages-${restaurantId}`, JSON.stringify([...visibleLanguages]));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesign({ ...design, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  function toggleLanguage(code: LanguageCode) {
    setVisibleLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code); // Keep at least one language
      } else {
        next.add(code);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-semibold">Public page design</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Customize how your restaurant looks to diners. Changes appear in Preview instantly.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Logo</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm cursor-pointer hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" />
                      Upload logo
                    </label>
                    {design.logo && (
                      <button
                        onClick={() => setDesign({ ...design, logo: "" })}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {design.logo && (
                    <img src={design.logo} alt="Logo preview" className="h-16 w-auto object-contain" />
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Restaurant name (title)</label>
                <input
                  type="text"
                  value={design.restaurantName}
                  onChange={(e) => setDesign({ ...design, restaurantName: e.target.value })}
                  placeholder="Your Restaurant Name"
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slogan / Tagline</label>
                <input
                  type="text"
                  value={design.slogan}
                  onChange={(e) => setDesign({ ...design, slogan: e.target.value })}
                  placeholder="Best food in town"
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Section Colors</h3>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Header color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.headerColor}
                    onChange={(e) => setDesign({ ...design, headerColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.headerColor}
                    onChange={(e) => setDesign({ ...design, headerColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Main color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.mainColor}
                    onChange={(e) => setDesign({ ...design, mainColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.mainColor}
                    onChange={(e) => setDesign({ ...design, mainColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Footer color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.footerColor}
                    onChange={(e) => setDesign({ ...design, footerColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.footerColor}
                    onChange={(e) => setDesign({ ...design, footerColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Text Colors</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Title color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.titleColor}
                    onChange={(e) => setDesign({ ...design, titleColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.titleColor}
                    onChange={(e) => setDesign({ ...design, titleColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Text color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.textColor}
                    onChange={(e) => setDesign({ ...design, textColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.textColor}
                    onChange={(e) => setDesign({ ...design, textColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Price color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.priceColor}
                    onChange={(e) => setDesign({ ...design, priceColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.priceColor}
                    onChange={(e) => setDesign({ ...design, priceColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Category color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={design.categoryColor}
                    onChange={(e) => setDesign({ ...design, categoryColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={design.categoryColor}
                    onChange={(e) => setDesign({ ...design, categoryColor: e.target.value })}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Typography</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Title font</label>
                <select
                  value={design.titleFont}
                  onChange={(e) => setDesign({ ...design, titleFont: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Text font</label>
                <select
                  value={design.textFont}
                  onChange={(e) => setDesign({ ...design, textFont: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Footer Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  type="text"
                  value={design.location}
                  onChange={(e) => setDesign({ ...design, location: e.target.value })}
                  placeholder="123 Main Street, City"
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Opening hours</label>
                <input
                  type="text"
                  value={design.hours}
                  onChange={(e) => setDesign({ ...design, hours: e.target.value })}
                  placeholder="Mon-Fri: 9am-10pm, Sat-Sun: 10am-11pm"
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact information</label>
                <input
                  type="text"
                  value={design.contactInfo}
                  onChange={(e) => setDesign({ ...design, contactInfo: e.target.value })}
                  placeholder="+1 234 567 890 | email@example.com"
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Card Style</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Card radius</label>
                <select
                  value={design.cardRadius}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      cardRadius: e.target.value as RestaurantDesign["cardRadius"],
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <option value="rounded">Rounded</option>
                  <option value="sharp">Sharp corners</option>
                  <option value="pill">Extra rounded</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Header style</label>
                <select
                  value={design.headerStyle}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      headerStyle: e.target.value as RestaurantDesign["headerStyle"],
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <option value="minimal">Minimal</option>
                  <option value="bold">Bold (ring accent)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Menu view mode</label>
                <select
                  value={design.menuViewMode}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      menuViewMode: e.target.value as RestaurantDesign["menuViewMode"],
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <option value="carousel">Carousel (horizontal scroll)</option>
                  <option value="stacked">Stacked (list view)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSave}>{saved ? "Saved!" : "Save design"}</Button>
          <div
            className="h-16 flex-1 rounded-2xl border border-border"
            style={{ backgroundColor: design.backgroundColor }}
          >
            <div
              className="m-3 inline-block rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: design.accentColor }}
            >
              Preview swatch
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-semibold">Available languages</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Select which languages diners can choose from on your public menu page.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LANGUAGES.map((lang) => (
            <label
              key={lang.code}
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleLanguages.has(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
                disabled={visibleLanguages.size === 1 && visibleLanguages.has(lang.code)}
                className="rounded border-border"
              />
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.label}</span>
            </label>
          ))}
        </div>

        <p className="mt-3 text-xs text-text-secondary">
          {visibleLanguages.size} language{visibleLanguages.size !== 1 ? 's' : ''} selected
        </p>
      </div>
    </div>
  );
}
