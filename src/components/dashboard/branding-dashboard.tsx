"use client";

import { useRef, useState } from "react";
import { useDesign } from "@/contexts/design-context";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";

export function BrandingDashboard() {
  const { design, updateDesign } = useDesign();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const logoInputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="mt-1 text-sm text-gray-600">Logo and SEO settings for your public menu</p>
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

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
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
                  onClick={() => updateDesign({ logo: "" })}
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
              onClick={() => logoInputRef.current?.click()}
              className="gap-2 w-full max-w-xs"
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

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Meta Title (SEO)</label>
          <input
            type="text"
            placeholder="e.g., Best Pizza in New York - Restaurant Name"
            value={design.metaTitle}
            onChange={(e) => updateDesign({ metaTitle: e.target.value })}
            className="w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended: 50–60 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Meta Description (SEO)</label>
          <textarea
            placeholder="e.g., Authentic Italian pizza made with fresh ingredients."
            value={design.metaDescription}
            onChange={(e) => updateDesign({ metaDescription: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended: 150–160 characters</p>
        </div>
      </div>
    </div>
  );
}
