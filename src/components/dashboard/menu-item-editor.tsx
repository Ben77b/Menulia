"use client";

import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALLERGEN_ICONS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MenuItemEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItemData) => void;
  initialData?: MenuItemData;
}

export interface MenuItemData {
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  allergens: string[];
  tags: string[];
}

const ALLERGEN_OPTIONS = Object.keys(ALLERGEN_ICONS);
const TAG_OPTIONS = ["Vegan", "Vegetarian", "Gluten-Free"];

export function MenuItemEditor({ isOpen, onClose, onSave, initialData }: MenuItemEditorProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [allergens, setAllergens] = useState<string[]>(initialData?.allergens || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleAllergen(allergen: string) {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Convert image to base64 for demo purposes
      // In production, you'd upload to a service like Cloudinary, AWS S3, etc.
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
    }
  }

  function handleSave() {
    if (!name) return;
    onSave({
      name,
      description,
      price,
      image_url: imageUrl || null,
      allergens,
      tags,
    });
    onClose();
    // Reset form
    setName("");
    setDescription("");
    setPrice(0);
    setImageUrl("");
    setAllergens([]);
    setTags([]);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initialData ? "Edit menu item" : "Add menu item"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Image */}
          <div>
            <label className="text-sm font-medium">Image</label>
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {imageUrl && (
              <div className="mt-2 h-32 w-full overflow-hidden rounded-xl bg-muted">
                <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              placeholder="Dish name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              rows={3}
              placeholder="Brief description of the dish"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium">Price *</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Allergens */}
          <div>
            <label className="text-sm font-medium">Allergens</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <button
                  key={allergen}
                  onClick={() => toggleAllergen(allergen)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    allergens.includes(allergen)
                      ? "border-emerald-brand bg-emerald-brand-light text-emerald-brand"
                      : "border-border hover:border-emerald-brand"
                  )}
                >
                  <span>{ALLERGEN_ICONS[allergen]}</span>
                  {allergen}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="text-sm font-medium">Dietary tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    tags.includes(tag)
                      ? "border-emerald-brand bg-emerald-brand-light text-emerald-brand"
                      : "border-border hover:border-emerald-brand"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
