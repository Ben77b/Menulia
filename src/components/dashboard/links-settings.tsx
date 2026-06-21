"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X } from "lucide-react";
import type { CustomRestaurantLink } from "@/lib/types";

interface LinksSettingsProps {
  initialLinks: CustomRestaurantLink[];
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  websiteUrl?: string | null;
  onLinksChange?: (links: CustomRestaurantLink[]) => void;
}

export function LinksSettings({
  initialLinks,
  onLinksChange,
}: LinksSettingsProps) {
  const [customLinks, setCustomLinks] = useState(initialLinks);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function addLink() {
    if (!newLabel || !newUrl) return;
    const newLinks = [
      ...customLinks,
      { id: `custom-${Date.now()}`, restaurant_id: "", label: newLabel, url: newUrl },
    ];
    setCustomLinks(newLinks);
    onLinksChange?.(newLinks);
    setNewLabel("");
    setNewUrl("");
  }

  function removeCustomLink(id: string) {
    const newLinks = customLinks.filter((l) => l.id !== id);
    setCustomLinks(newLinks);
    onLinksChange?.(newLinks);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-semibold">Burger menu links</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Add custom links to your public page's burger menu. Add as many as you want.
      </p>

      {/* All links list */}
      <ul className="mt-4 space-y-2">
        {customLinks.length === 0 ? (
          <li className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-text-secondary">
            No links added yet. Add your first link below.
          </li>
        ) : (
          customLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5 text-sm"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium">{link.label}</span>
                <span className="ml-2 truncate text-text-secondary">{link.url}</span>
              </div>
              <button
                onClick={() => removeCustomLink(link.id)}
                className="ml-2 rounded p-1 hover:bg-white/50 text-text-secondary hover:text-red-500"
                aria-label="Remove link"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Add custom link */}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          placeholder="Label (e.g. Instagram)"
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
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
