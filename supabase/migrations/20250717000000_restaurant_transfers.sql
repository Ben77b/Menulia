-- Pending restaurant ownership transfers (secure token claim flow)

CREATE TABLE IF NOT EXISTS public.restaurant_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  recipient_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS restaurant_transfers_one_pending_per_restaurant
  ON public.restaurant_transfers (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_transfers_token
  ON public.restaurant_transfers (token);

ALTER TABLE public.restaurant_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read restaurant transfers" ON public.restaurant_transfers;
CREATE POLICY "Owners read restaurant transfers"
  ON public.restaurant_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners insert restaurant transfers" ON public.restaurant_transfers;
CREATE POLICY "Owners insert restaurant transfers"
  ON public.restaurant_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners delete restaurant transfers" ON public.restaurant_transfers;
CREATE POLICY "Owners delete restaurant transfers"
  ON public.restaurant_transfers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

-- Public preview by secret token (token itself is the credential)
CREATE OR REPLACE FUNCTION public.get_restaurant_transfer_preview(p_token TEXT)
RETURNS TABLE (
  restaurant_name TEXT,
  recipient_email TEXT,
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.name AS restaurant_name,
    t.recipient_email,
    t.expires_at,
    (t.expires_at > NOW()) AS is_valid
  FROM public.restaurant_transfers t
  JOIN public.restaurants r ON r.id = t.restaurant_id
  WHERE t.token = p_token
  LIMIT 1;
$$;

-- Atomically transfer ownership to the authenticated recipient
CREATE OR REPLACE FUNCTION public.claim_restaurant_transfer(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.restaurant_transfers%ROWTYPE;
  v_user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_transfer
  FROM public.restaurant_transfers
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  IF v_transfer.expires_at <= NOW() THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  IF LOWER(TRIM(v_user_email)) <> LOWER(TRIM(v_transfer.recipient_email)) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  UPDATE public.restaurants
  SET user_id = auth.uid()
  WHERE id = v_transfer.restaurant_id;

  DELETE FROM public.restaurant_transfers
  WHERE id = v_transfer.id;

  RETURN v_transfer.restaurant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_restaurant_transfer_preview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_restaurant_transfer_preview(TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.claim_restaurant_transfer(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_restaurant_transfer(TEXT) TO authenticated;
