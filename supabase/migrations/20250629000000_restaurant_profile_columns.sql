-- Root profile columns used by Settings and the public menu footer.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hours TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_info TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT NOT NULL DEFAULT '';

-- Ensure updated_at exists for dashboard saves.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

NOTIFY pgrst, 'reload schema';
