-- Paste this entire block into Supabase → SQL Editor → Run

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS footer_slogan TEXT NOT NULL DEFAULT '';

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS show_prices BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_descriptions BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_images BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_dietary BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS advanced_theme JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
