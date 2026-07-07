import type { HoursScheduleBlock } from "@/lib/hours-schedule";
import { defaultScheduleBlocks, parseHoursSchedule } from "@/lib/hours-schedule";
import { parseContactInfo } from "@/lib/contact-info";
import type { RestaurantSettingsForm } from "@/lib/restaurant-settings";

export interface SettingsCustomLinkDraft {
  id: string;
  label: string;
  url: string;
}

export interface SettingsFormDraft {
  restaurantName: string;
  restaurantTagline: string;
  restaurantLocation: string;
  restaurantPhone: string;
  restaurantEmail: string;
  restaurantSlug: string;
  originalSlug: string;
  footerSlogan: string;
  scheduleBlocks: HoursScheduleBlock[];
  customLinks: SettingsCustomLinkDraft[];
  dirty: boolean;
}

export const EMPTY_SETTINGS_FORM_DRAFT: SettingsFormDraft = {
  restaurantName: "",
  restaurantTagline: "",
  restaurantLocation: "",
  restaurantPhone: "",
  restaurantEmail: "",
  restaurantSlug: "",
  originalSlug: "",
  footerSlogan: "",
  scheduleBlocks: defaultScheduleBlocks(),
  customLinks: [],
  dirty: false,
};

export function normalizeSettingsFormDraft(value: unknown): SettingsFormDraft {
  if (!value || typeof value !== "object") {
    return EMPTY_SETTINGS_FORM_DRAFT;
  }

  const draft = value as Partial<SettingsFormDraft>;
  const scheduleBlocks = Array.isArray(draft.scheduleBlocks)
    ? draft.scheduleBlocks
    : defaultScheduleBlocks();

  const customLinks = Array.isArray(draft.customLinks)
    ? draft.customLinks
        .filter(
          (link): link is SettingsCustomLinkDraft =>
            Boolean(link) &&
            typeof link === "object" &&
            typeof (link as SettingsCustomLinkDraft).id === "string"
        )
        .map((link) => ({
          id: link.id,
          label: typeof link.label === "string" ? link.label : "",
          url: typeof link.url === "string" ? link.url : "",
        }))
    : [];

  return {
    restaurantName: typeof draft.restaurantName === "string" ? draft.restaurantName : "",
    restaurantTagline: typeof draft.restaurantTagline === "string" ? draft.restaurantTagline : "",
    restaurantLocation: typeof draft.restaurantLocation === "string" ? draft.restaurantLocation : "",
    restaurantPhone: typeof draft.restaurantPhone === "string" ? draft.restaurantPhone : "",
    restaurantEmail: typeof draft.restaurantEmail === "string" ? draft.restaurantEmail : "",
    restaurantSlug: typeof draft.restaurantSlug === "string" ? draft.restaurantSlug : "",
    originalSlug: typeof draft.originalSlug === "string" ? draft.originalSlug : "",
    footerSlogan: typeof draft.footerSlogan === "string" ? draft.footerSlogan : "",
    scheduleBlocks,
    customLinks,
    dirty: Boolean(draft.dirty),
  };
}

export function settingsDraftFromLoadedData(data: {
  name: string;
  tagline: string;
  location: string;
  slug: string;
  hours: string;
  contact_info: string;
  footer_slogan: string;
  custom_links?: Array<{ id?: string; label?: string; url?: string }>;
}): SettingsFormDraft {
  const contact = parseContactInfo(data.contact_info);
  const parsedHours = parseHoursSchedule(data.hours);

  return {
    restaurantName: data.name ?? "",
    restaurantTagline: data.tagline ?? "",
    restaurantLocation: data.location ?? "",
    restaurantPhone: contact.phone,
    restaurantEmail: contact.email,
    restaurantSlug: data.slug ?? "",
    originalSlug: data.slug ?? "",
    footerSlogan: data.footer_slogan ?? "",
    scheduleBlocks: parsedHours ?? defaultScheduleBlocks(),
    customLinks: (data.custom_links ?? []).map((link, index) => ({
      id: link.id?.trim() || `link-${index}`,
      label: link.label ?? "",
      url: link.url ?? "",
    })),
    dirty: false,
  };
}

export function settingsDraftToSaveForm(draft: SettingsFormDraft): RestaurantSettingsForm {
  return {
    name: draft.restaurantName,
    slug: draft.restaurantSlug,
    originalSlug: draft.originalSlug,
    tagline: draft.restaurantTagline,
    location: draft.restaurantLocation,
    phone: draft.restaurantPhone,
    email: draft.restaurantEmail,
    scheduleBlocks: draft.scheduleBlocks,
    footerSlogan: draft.footerSlogan,
    links: draft.customLinks,
  };
}
