export interface PublicMenuDisplayOptions {
  showPrices: boolean;
  showDescriptions: boolean;
  showImages: boolean;
  showDietary: boolean;
}

export const DEFAULT_DISPLAY_OPTIONS: PublicMenuDisplayOptions = {
  showPrices: true,
  showDescriptions: true,
  showImages: true,
  showDietary: true,
};

export function parseDisplayOptions(row: {
  show_prices?: boolean | null;
  show_descriptions?: boolean | null;
  show_images?: boolean | null;
  show_dietary?: boolean | null;
}): PublicMenuDisplayOptions {
  return {
    showPrices: row.show_prices ?? true,
    showDescriptions: row.show_descriptions ?? true,
    showImages: row.show_images ?? true,
    showDietary: row.show_dietary ?? true,
  };
}

export function serializeDisplayOptions(options: PublicMenuDisplayOptions) {
  return {
    show_prices: options.showPrices,
    show_descriptions: options.showDescriptions,
    show_images: options.showImages,
    show_dietary: options.showDietary,
  };
}
