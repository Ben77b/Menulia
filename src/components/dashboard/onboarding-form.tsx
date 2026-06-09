"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DAY_NAMES } from "@/lib/types";
import { slugify } from "@/lib/utils";

interface HourRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ name: "", email: "", restaurantName: "" });
  const [hours, setHours] = useState<HourRow[]>(
    DAY_NAMES.map((_, i) => ({
      day_of_week: i,
      open_time: "11:00",
      close_time: "22:00",
      is_closed: i === 1,
    }))
  );

  function updateHour(day: number, field: keyof HourRow, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === day ? { ...h, [field]: value } : h))
    );
  }

  function handleComplete() {
    localStorage.setItem("menulia_onboarding_complete", "true");
    localStorage.setItem(
      "menulia_restaurant",
      JSON.stringify({
        name: profile.restaurantName,
        slug: slugify(profile.restaurantName),
      })
    );
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-emerald-brand" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your profile</h2>
          <p className="text-sm text-text-secondary">
            Tell us about yourself and your restaurant to get started.
          </p>
          <input
            placeholder="Your name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
          />
          <input
            type="email"
            placeholder="Email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
          />
          <input
            placeholder="Restaurant name"
            value={profile.restaurantName}
            onChange={(e) => setProfile({ ...profile, restaurantName: e.target.value })}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-emerald-brand"
          />
          <Button
            className="w-full"
            size="lg"
            disabled={!profile.name || !profile.email || !profile.restaurantName}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Operating hours</h2>
          <p className="text-sm text-text-secondary">
            Required before you can access the dashboard.
          </p>
          <div className="space-y-3">
            {hours.map((h) => (
              <div
                key={h.day_of_week}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
              >
                <span className="w-24 text-sm font-medium">{DAY_NAMES[h.day_of_week]}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    onChange={(e) => updateHour(h.day_of_week, "is_closed", e.target.checked)}
                  />
                  Closed
                </label>
                {!h.is_closed && (
                  <>
                    <input
                      type="time"
                      value={h.open_time}
                      onChange={(e) => updateHour(h.day_of_week, "open_time", e.target.value)}
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    />
                    <span className="text-text-secondary">–</span>
                    <input
                      type="time"
                      value={h.close_time}
                      onChange={(e) => updateHour(h.day_of_week, "close_time", e.target.value)}
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" size="lg" onClick={handleComplete}>
              Save & unlock dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
