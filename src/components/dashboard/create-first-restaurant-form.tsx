"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createRestaurant } from "@/lib/data";
import { slugify } from "@/lib/utils";
import { useRestaurant } from "@/contexts/restaurant-context";

export function CreateFirstRestaurantForm() {
  const router = useRouter();
  const { refreshRestaurants } = useRestaurant();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      setError("Restaurant name is required.");
      return;
    }

    if (!trimmedSlug || !/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setError("URL slug must contain only lowercase letters, numbers, and hyphens.");
      return;
    }

    try {
      setSubmitting(true);

      const restaurant = await createRestaurant({
        name: trimmedName,
        slug: trimmedSlug,
      });

      await refreshRestaurants();
      router.replace(`/dashboard/${restaurant.id}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Failed to create restaurant.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="first-restaurant-name" className="mb-1.5 block text-sm font-medium text-gray-700">
          Restaurant Name
        </label>
        <input
          id="first-restaurant-name"
          type="text"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="e.g. La Calle Tacos"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label htmlFor="first-restaurant-slug" className="mb-1.5 block text-sm font-medium text-gray-700">
          URL Slug
        </label>
        <div className="flex items-center rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <span className="pl-3 text-sm text-gray-400">menulia.net/</span>
          <input
            id="first-restaurant-slug"
            type="text"
            value={slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            placeholder="la-calle-tacos"
            className="flex-1 rounded-r-lg px-2 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Creating..." : "Create Restaurant"}
      </Button>
    </form>
  );
}
