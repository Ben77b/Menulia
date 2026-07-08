ALTER TABLE dishes
ADD COLUMN IF NOT EXISTS lock_title_translation BOOLEAN DEFAULT false;
