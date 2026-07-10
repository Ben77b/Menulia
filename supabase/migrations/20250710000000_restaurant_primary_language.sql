-- Primary menu language for builder defaults and public menu locale (EU launch default: Spanish).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS primary_language TEXT NOT NULL DEFAULT 'es';

COMMENT ON COLUMN public.restaurants.primary_language IS
  'Primary menu content language code (en or es). Builder edits this locale first.';
