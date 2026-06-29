-- Account security preferences (2FA placeholder, future security flags)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_preferences JSONB NOT NULL DEFAULT '{"two_factor_enabled": false}'::jsonb;
