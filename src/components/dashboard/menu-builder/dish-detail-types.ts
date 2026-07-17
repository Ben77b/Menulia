export interface PriceVariationDraft {
  label: string;
  price: string;
}

export interface DishDetailDraft {
  name: string;
  nameTranslation: string;
  description: string;
  descriptionTranslation: string;
  price: string;
  usePriceVariations: boolean;
  priceVariations: PriceVariationDraft[];
  image_url: string | null;
  filterableTags: string[];
  allergens: string[];
  is_available: boolean;
}
