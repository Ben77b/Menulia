import type { RestaurantSummary } from "@/contexts/restaurant-context";
import type { RestaurantLink } from "@/lib/restaurant-links";

export interface RestaurantPreviewProfile {
  restaurantName: string;
  location: string;
  hours: string;
  contactInfo: string;
  footerSlogan: string;
  links: RestaurantLink[];
}

export function restaurantPreviewProfileFromSummary(
  restaurant: RestaurantSummary | null | undefined
): RestaurantPreviewProfile {
  return {
    restaurantName: restaurant?.name ?? "",
    location: restaurant?.location ?? "",
    hours: restaurant?.hours ?? "",
    contactInfo: restaurant?.contact_info ?? "",
    footerSlogan: restaurant?.footer_slogan ?? "",
    links: restaurant?.custom_links ?? [],
  };
}
