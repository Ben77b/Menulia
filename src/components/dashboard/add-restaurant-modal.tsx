"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRestaurant, uploadRestaurantLogo, waitForRestaurantInList } from "@/lib/data";
import { slugify } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useRestaurant } from "@/contexts/restaurant-context";
import { RestaurantCreationError } from "@/lib/auth/errors";

interface AddRestaurantModalProps {
  open: boolean;
  onClose: () => void;
  mode?: "first" | "additional";
}

export function AddRestaurantModal({ open, onClose, mode = "additional" }: AddRestaurantModalProps) {
  const router = useRouter();
  const { refreshRestaurants, activateRestaurant } = useRestaurant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!open) return null;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
    );
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setLogoFile(null);
    setLogoPreview(null);
    setError("");
    setNotice("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      setError("Restaurant name is required.");
      return;
    }

    if (!trimmedSlug || !/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setError("Slug must contain only lowercase letters, numbers, and hyphens.");
      return;
    }

    try {
      setSubmitting(true);

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("You must be signed in to create a restaurant.");
        return;
      }

      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadRestaurantLogo(logoFile, session.user.id);
      }

      const { restaurant, finalSlug, slugWasAdjusted } = await createRestaurant({
        name: trimmedName,
        slug: trimmedSlug,
        logo: logoUrl,
      });

      if (slugWasAdjusted) {
        setSlug(finalSlug);
        setNotice(
          `That URL was already taken. Your menu will live at menulia.net/${finalSlug}.`
        );
      }

      await waitForRestaurantInList(refreshRestaurants, restaurant.id);

      activateRestaurant(restaurant.id, {
        id: restaurant.id,
        name: restaurant.name,
        slug: finalSlug,
        logo: restaurant.logo ?? null,
        user_id: restaurant.user_id,
        font_pack_id: restaurant.font_pack_id,
      });

      handleClose();
      router.push(`/dashboard/${restaurant.id}`);
    } catch (submitError) {
      console.error("[AddRestaurantModal] submission failed:", submitError);
      if (submitError instanceof RestaurantCreationError) {
        setError(submitError.toDisplayMessage());
        return;
      }
      const message =
        submitError instanceof Error ? submitError.message : "Failed to create restaurant.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "first" ? "Create your first restaurant" : "Add New Restaurant"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "first"
                ? "Set up your restaurant profile to start building your menu."
                : "Create another location under your account."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="restaurant-name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Restaurant Name
            </label>
            <input
              id="restaurant-name"
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="e.g. La Calle Tacos"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="restaurant-slug" className="mb-1.5 block text-sm font-medium text-gray-700">
              URL Slug
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="pl-3 text-sm text-gray-400">menulia.net/</span>
              <input
                id="restaurant-slug"
                type="text"
                value={slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="la-calle-tacos"
                className="flex-1 rounded-r-lg px-2 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-500">PNG, JPEG, or WebP up to 5MB</p>
              </div>
            </div>
          </div>

          {notice && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{notice}</p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting
                ? "Creating..."
                : mode === "first"
                  ? "Create Restaurant"
                  : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
