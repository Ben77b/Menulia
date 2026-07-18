-- Optional: skip DeepL translation of category titles (same semantics as dishes.lock_title_translation)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS lock_title_translation BOOLEAN NOT NULL DEFAULT false;
