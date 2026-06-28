-- Display toggles for the public menu (prices, descriptions, images, dietary info).

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS show_prices BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_descriptions BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_images BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_dietary BOOLEAN NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
