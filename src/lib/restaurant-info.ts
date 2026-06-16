export interface RestaurantInfo {
  phone: string;
  contact_email: string;
  address: string;
  instagram_url: string;
  facebook_url: string;
  website_url: string;
  whatsapp_url: string;
  operating_hours: HourOverride[];
}

export interface HourOverride {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const STORAGE_KEY = "menulia_restaurant_info";

export function loadRestaurantInfo(
  restaurantId: string,
  defaults: Partial<RestaurantInfo>
): RestaurantInfo {
  if (typeof window === "undefined") return mergeDefaults(defaults);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${restaurantId}`);
    return raw ? { ...mergeDefaults(defaults), ...JSON.parse(raw) } : mergeDefaults(defaults);
  } catch {
    return mergeDefaults(defaults);
  }
}

export function saveRestaurantInfo(restaurantId: string, info: RestaurantInfo) {
  localStorage.setItem(`${STORAGE_KEY}_${restaurantId}`, JSON.stringify(info));
  window.dispatchEvent(new StorageEvent("storage", { key: `${STORAGE_KEY}_${restaurantId}` }));
}

function mergeDefaults(defaults: Partial<RestaurantInfo>): RestaurantInfo {
  return {
    phone: defaults.phone ?? "",
    contact_email: defaults.contact_email ?? "",
    address: defaults.address ?? "",
    instagram_url: defaults.instagram_url ?? "",
    facebook_url: defaults.facebook_url ?? "",
    website_url: defaults.website_url ?? "",
    whatsapp_url: defaults.whatsapp_url ?? "",
    operating_hours: defaults.operating_hours ?? [],
  };
}
