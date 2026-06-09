"use client";

import { useState, useEffect } from "react";
import {
  loadDesign,
  saveDesign,
  DEFAULT_DESIGN,
  type RestaurantDesign,
} from "@/lib/restaurant-design";
import { Button } from "@/components/ui/button";

interface DesignSettingsProps {
  restaurantId: string;
}

export function DesignSettings({ restaurantId }: DesignSettingsProps) {
  const [design, setDesign] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDesign(loadDesign(restaurantId));
  }, [restaurantId]);

  function handleSave() {
    saveDesign(restaurantId, design);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-semibold">Public page design</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Customize how your restaurant looks to diners. Changes appear in Preview instantly.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Accent color</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={design.accentColor}
              onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border"
            />
            <input
              type="text"
              value={design.accentColor}
              onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
              className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Background color</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={design.backgroundColor}
              onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border"
            />
            <input
              type="text"
              value={design.backgroundColor}
              onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
              className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Card style</label>
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
  );
}
