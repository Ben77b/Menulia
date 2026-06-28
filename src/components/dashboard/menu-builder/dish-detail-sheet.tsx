"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";

const DIETARY_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Spicy"] as const;

const ALLERGEN_TAGS = [
  "Contains Nuts",
  "Contains Dairy",
  "Contains Gluten",
  "Contains Shellfish",
  "Contains Soy",
  "Contains Eggs",
] as const;

export interface DishDetailDraft {
  name: string;
  description: string;
  price: string;
  image_url: string | null;
  tags: string[];
}

interface DishDetailSheetProps {
  open: boolean;
  dish: MenuBuilderDish | null;
  saving?: boolean;
  uploadingImage?: boolean;
  onClose: () => void;
  onSave: (draft: DishDetailDraft) => Promise<void>;
  onImageUpload: (file: File) => Promise<string | null>;
}

export function DishDetailSheet({
  open,
  dish,
  saving,
  uploadingImage,
  onClose,
  onSave,
  onImageUpload,
}: DishDetailSheetProps) {
  const [draft, setDraft] = useState<DishDetailDraft>({
    name: "",
    description: "",
    price: "",
    image_url: null,
    tags: [],
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !dish) return;
    setDraft({
      name: dish.name,
      description: dish.description,
      price: String(dish.price),
      image_url: dish.image_url,
      tags: dish.tags,
    });
  }, [open, dish]);

  function toggleTag(tag: string) {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onImageUpload(file);
    if (url) setDraft((prev) => ({ ...prev, image_url: url }));
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Dish</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Photo</label>
            <div className="flex items-center gap-4">
              {draft.image_url ? (
                <div className="relative">
                  <img
                    src={draft.image_url}
                    alt={draft.name}
                    className="h-24 w-24 rounded-xl border border-gray-100 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, image_url: null }))}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <Camera className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? "Uploading…" : "Upload"}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price (€)</label>
            <input
              type="number"
              step="0.01"
              value={draft.price}
              onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    draft.tags.includes(tag)
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    draft.tags.includes(tag)
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-gray-200 text-gray-600"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || !draft.name.trim()} onClick={() => onSave(draft)}>
            {saving ? "Saving…" : "Save Dish"}
          </Button>
        </div>
      </aside>
    </>
  );
}
