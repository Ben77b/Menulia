"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CustomRestaurantLink } from "@/lib/types";

interface LinksSettingsProps {
  initialLinks: CustomRestaurantLink[];
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
}

export function LinksSettings({
  initialLinks,
  instagramUrl,
  facebookUrl,
  websiteUrl,
}: LinksSettingsProps) {
  const [customLinks, setCustomLinks] = useState(initialLinks);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function addLink() {
    if (!newLabel || !newUrl) return;
    setCustomLinks((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, restaurant_id: "", label: newLabel, url: newUrl },
    ]);
    setNewLabel("");
    setNewUrl("");
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-semibold">Burger menu links</h2>
      <p className="mt-1 text-sm text-text-secondary">
        These appear when guests tap the ☰ menu on your public page.
      </p>

      <ul className="mt-4 space-y-2">
        {(
          [
            instagramUrl ? { label: "Instagram", url: instagramUrl } : null,
            facebookUrl ? { label: "Facebook", url: facebookUrl } : null,
            websiteUrl ? { label: "Website", url: websiteUrl } : null,
            ...customLinks.map((l) => ({ label: l.label, url: l.url })),
          ].filter((l): l is { label: string; url: string } => l !== null)
        ).map((link) => (
            <li
              key={link.label}
              className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5 text-sm"
            >
              <span className="font-medium">{link.label}</span>
              <span className="truncate text-text-secondary">{link.url}</span>
            </li>
          ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          placeholder="Label (e.g. TripAdvisor)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm min-w-[140px]"
        />
        <input
          placeholder="https://..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm min-w-[180px]"
        />
        <Button onClick={addLink} size="sm">
          Add link
        </Button>
      </div>
    </div>
  );
}
