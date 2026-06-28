"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Globe,
  MessageCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_DESIGN, type RestaurantDesign } from "@/lib/restaurant-design";
import {
  loadRestaurantInfo,
  saveRestaurantInfo,
  type RestaurantInfo,
  type HourOverride,
} from "@/lib/restaurant-info";
import { DAY_NAMES } from "@/lib/types";
import type { OperatingHour } from "@/lib/types";

interface SettingsInfoPanelProps {
  restaurantId: string;
  defaultPhone: string | null;
  defaultEmail: string | null;
  defaultAddress: string | null;
  defaultInstagram: string | null;
  defaultFacebook: string | null;
  defaultWebsite: string | null;
  defaultWhatsapp: string | null;
  defaultHours: OperatingHour[];
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs font-medium text-text-secondary transition hover:text-text-primary"
      aria-pressed={checked}
    >
      {checked ? (
        <Eye className="h-3.5 w-3.5 text-emerald-brand" />
      ) : (
        <EyeOff className="h-3.5 w-3.5" />
      )}
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
          checked
            ? "bg-emerald-brand-light text-emerald-brand"
            : "bg-muted text-text-secondary"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
  showKey,
  design,
  onDesignChange,
}: {
  title: string;
  subtitle: string;
  showKey: keyof Pick<RestaurantDesign, "showFooterContact" | "showFooterHours" | "showFooterLinks">;
  design: RestaurantDesign;
  onDesignChange: (d: RestaurantDesign) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
      </div>
      <Toggle
        checked={design[showKey]}
        onChange={(v) => onDesignChange({ ...design, [showKey]: v })}
        label={design[showKey] ? "Shown in footer" : "Hidden in footer"}
      />
    </div>
  );
}

export function SettingsInfoPanel({
  restaurantId,
  defaultPhone,
  defaultEmail,
  defaultAddress,
  defaultInstagram,
  defaultFacebook,
  defaultWebsite,
  defaultWhatsapp,
  defaultHours,
}: SettingsInfoPanelProps) {
  const [design, setDesign] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [info, setInfo] = useState<RestaurantInfo>(() =>
    loadRestaurantInfo("__init__", {
      phone: defaultPhone ?? "",
      contact_email: defaultEmail ?? "",
      address: defaultAddress ?? "",
      instagram_url: defaultInstagram ?? "",
      facebook_url: defaultFacebook ?? "",
      website_url: defaultWebsite ?? "",
      whatsapp_url: defaultWhatsapp ?? "",
      operating_hours: defaultHours.map((h) => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time?.slice(0, 5) ?? "11:00",
        close_time: h.close_time?.slice(0, 5) ?? "22:00",
        is_closed: h.is_closed,
      })),
    })
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInfo(
      loadRestaurantInfo(restaurantId, {
        phone: defaultPhone ?? "",
        contact_email: defaultEmail ?? "",
        address: defaultAddress ?? "",
        instagram_url: defaultInstagram ?? "",
        facebook_url: defaultFacebook ?? "",
        website_url: defaultWebsite ?? "",
        whatsapp_url: defaultWhatsapp ?? "",
        operating_hours: defaultHours.map((h) => ({
          day_of_week: h.day_of_week,
          open_time: h.open_time?.slice(0, 5) ?? "11:00",
          close_time: h.close_time?.slice(0, 5) ?? "22:00",
          is_closed: h.is_closed,
        })),
      })
    );
  }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateHour(day: number, field: keyof HourOverride, value: string | boolean) {
    setInfo((prev) => ({
      ...prev,
      operating_hours: prev.operating_hours.map((h) =>
        h.day_of_week === day ? { ...h, [field]: value } : h
      ),
    }));
  }

  function handleSave() {
    saveRestaurantInfo(restaurantId, info);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none transition focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/20";

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <SectionHeader
          title="Contact Information"
          subtitle="Phone, email, and address shown in the guest footer."
          showKey="showFooterContact"
          design={design}
          onDesignChange={setDesign}
        />
        <div className="mt-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
              <Phone className="h-3.5 w-3.5" /> Phone number
            </label>
            <input
              type="tel"
              placeholder="+34 900 000 000"
              value={info.phone}
              onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
              <Mail className="h-3.5 w-3.5" /> Email address
            </label>
            <input
              type="email"
              placeholder="hello@myrestaurant.com"
              value={info.contact_email}
              onChange={(e) => setInfo({ ...info, contact_email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
              <MapPin className="h-3.5 w-3.5" /> Physical address
            </label>
            <input
              placeholder="Street, City, Country"
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <SectionHeader
          title="Opening Hours"
          subtitle="Weekly schedule shown to guests in the menu footer."
          showKey="showFooterHours"
          design={design}
          onDesignChange={setDesign}
        />
        <div className="mt-5 space-y-2">
          {info.operating_hours.map((h) => (
            <div
              key={h.day_of_week}
              className={`grid grid-cols-[100px_1fr] items-center gap-3 rounded-xl border px-4 py-3 transition ${
                h.is_closed ? "border-border bg-muted/40" : "border-border bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{DAY_NAMES[h.day_of_week]}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    onChange={(e) => updateHour(h.day_of_week, "is_closed", e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-emerald-brand"
                  />
                  Closed
                </label>
                {!h.is_closed && (
                  <>
                    <Clock className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                    <input
                      type="time"
                      value={h.open_time}
                      onChange={(e) => updateHour(h.day_of_week, "open_time", e.target.value)}
                      className="w-24 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:border-emerald-brand"
                    />
                    <span className="text-text-secondary">–</span>
                    <input
                      type="time"
                      value={h.close_time}
                      onChange={(e) => updateHour(h.day_of_week, "close_time", e.target.value)}
                      className="w-24 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:border-emerald-brand"
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social & External Links */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <SectionHeader
          title="Social & External Links"
          subtitle="Links shown in the guest footer and burger menu."
          showKey="showFooterLinks"
          design={design}
          onDesignChange={setDesign}
        />
        <div className="mt-5 space-y-4">
          {[
            { key: "instagram_url" as const, icon: Instagram, label: "Instagram", placeholder: "https://instagram.com/yourpage" },
            { key: "facebook_url" as const, icon: Facebook, label: "Facebook", placeholder: "https://facebook.com/yourpage" },
            { key: "website_url" as const, icon: Globe, label: "Website", placeholder: "https://yourrestaurant.com" },
            { key: "whatsapp_url" as const, icon: MessageCircle, label: "WhatsApp", placeholder: "https://wa.me/34900000000" },
          ].map(({ key, icon: Icon, label, placeholder }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                <Icon className="h-3.5 w-3.5" /> {label}
              </label>
              <input
                type="url"
                placeholder={placeholder}
                value={info[key]}
                onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">
          {saved ? "Saved!" : "Save settings"}
        </Button>
        {saved && (
          <p className="text-sm text-emerald-brand">
            Changes are live on your public page.
          </p>
        )}
      </div>
    </div>
  );
}
