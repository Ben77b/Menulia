-- Explicit sort position for dishes within a category
ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
