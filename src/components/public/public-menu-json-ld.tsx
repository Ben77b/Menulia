import { JsonLd } from "@/components/marketing/json-ld";
import { buildPublicMenuJsonLd, type PublicRestaurantProfile } from "@/lib/public-menu-seo";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";

interface PublicMenuJsonLdProps {
  restaurant: PublicRestaurantProfile;
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
  lang?: string;
}

export function PublicMenuJsonLd({
  restaurant,
  menu,
  flatCategories,
  hasNestedStructure,
  lang = "en",
}: PublicMenuJsonLdProps) {
  const data = buildPublicMenuJsonLd({
    restaurant,
    menu,
    flatCategories,
    hasNestedStructure,
    lang,
  });

  return <JsonLd data={data} />;
}
