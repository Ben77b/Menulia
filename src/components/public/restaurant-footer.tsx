"use client";

import { Phone, Mail, MapPin, Clock, Instagram, Facebook, Globe, MessageCircle } from "lucide-react";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import type { RestaurantInfo } from "@/lib/restaurant-info";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RestaurantFooterProps {
  design: RestaurantDesign;
  info: RestaurantInfo;
}

export function RestaurantFooter({ design, info }: RestaurantFooterProps) {
  const showAny =
    design.showFooterContact || design.showFooterHours || design.showFooterLinks;

  if (!showAny) return null;

  const hasContact = info.phone || info.contact_email || info.address;
  const hasHours = info.operating_hours.length > 0;
  const socialLinks = [
    info.instagram_url && { label: "Instagram", url: info.instagram_url, icon: Instagram },
    info.facebook_url && { label: "Facebook", url: info.facebook_url, icon: Facebook },
    info.website_url && { label: "Website", url: info.website_url, icon: Globe },
    info.whatsapp_url && { label: "WhatsApp", url: info.whatsapp_url, icon: MessageCircle },
  ].filter(Boolean) as { label: string; url: string; icon: typeof Instagram }[];

  return (
    <footer
      className="shrink-0 border-t border-border/30 px-5 py-5"
      style={{ backgroundColor: design.backgroundColor }}
    >
      <div className="space-y-5">
        {/* Contact */}
        {design.showFooterContact && hasContact && (
          <div>
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: design.accentColor }}
            >
              Contact
            </p>
            <ul className="space-y-1.5">
              {info.phone && (
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: design.accentColor }} />
                  <a href={`tel:${info.phone}`} className="hover:underline">
                    {info.phone}
                  </a>
                </li>
              )}
              {info.contact_email && (
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: design.accentColor }} />
                  <a href={`mailto:${info.contact_email}`} className="hover:underline">
                    {info.contact_email}
                  </a>
                </li>
              )}
              {info.address && (
                <li className="flex items-start gap-2 text-sm text-text-secondary">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: design.accentColor }} />
                  <span>{info.address}</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Hours */}
        {design.showFooterHours && hasHours && (
          <div>
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: design.accentColor }}
            >
              Opening Hours
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {info.operating_hours.map((h) => (
                <li key={h.day_of_week} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-primary">{DAY_SHORT[h.day_of_week]}</span>
                  {h.is_closed ? (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Clock className="h-3 w-3" /> Closed
                    </span>
                  ) : (
                    <span className="text-text-secondary">
                      {h.open_time} – {h.close_time}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Social links */}
        {design.showFooterLinks && socialLinks.length > 0 && (
          <div>
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: design.accentColor }}
            >
              Find us
            </p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ label, url, icon: Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary transition hover:border-current hover:shadow-sm"
                  style={{ borderColor: `${design.accentColor}33` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: design.accentColor }} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
