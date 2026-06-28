-- Paste this entire block into Supabase → SQL Editor → Run

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS footer_slogan TEXT NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
