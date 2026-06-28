-- Granular theme overrides for Design Studio advanced mode.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS advanced_theme JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
