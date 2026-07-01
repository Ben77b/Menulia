import { JsonLd } from "@/components/marketing/json-ld";
import { buildPublicMenuJsonLd, type PublicRestaurantProfile } from "@/lib/public-menu-seo";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";

interface PublicMenuJsonLdProps {
  restaurant: PublicRestaurantProfile;
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
}

export function PublicMenuJsonLd({
  restaurant,
  menu,
  flatCategories,
  hasNestedStructure,
}: PublicMenuJsonLdProps) {
  const data = buildPublicMenuJsonLd({
    restaurant,
    menu,
    flatCategories,
    hasNestedStructure,
  });

  return <JsonLd data={data} />;
}
