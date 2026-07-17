-- Shared DeepL response cache to avoid repeat API calls for identical strings.

CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  source_lang TEXT NOT NULL DEFAULT 'auto',
  target_lang TEXT NOT NULL,
  tag_handling TEXT NOT NULL DEFAULT '',
  translated_text TEXT NOT NULL,
  detected_source_language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_hash, source_lang, target_lang, tag_handling)
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup
  ON public.translation_cache (source_hash, source_lang, target_lang, tag_handling);

ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Cache is shared infrastructure; only the service role (API route) reads/writes it.
-- No policies for anon/authenticated — access goes through SUPABASE_SERVICE_ROLE_KEY.
