-- Persist which colour layer the public menu should render (basic vs advanced)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS theme_mode TEXT NOT NULL DEFAULT 'basic';

COMMENT ON COLUMN restaurants.theme_mode IS 'Active theme layer: basic (macro + auto-contrast) or advanced (granular advanced_theme overrides)';
