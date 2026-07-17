-- Accept server-generated token + expiry for initiate_restaurant_transfer

DROP FUNCTION IF EXISTS public.initiate_restaurant_transfer(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.initiate_restaurant_transfer(
  p_restaurant_id UUID,
  p_recipient_email TEXT,
  p_token TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS SETOF public.restaurant_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_owner_email TEXT;
  v_recipient_email TEXT;
  v_transfer public.restaurant_transfers%ROWTYPE;
BEGIN
  v_owner_id := auth.uid();
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT u.email INTO v_owner_email
  FROM auth.users u
  WHERE u.id = v_owner_id;

  v_recipient_email := LOWER(TRIM(p_recipient_email));

  IF v_recipient_email = '' OR v_recipient_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  IF v_owner_email IS NOT NULL AND LOWER(TRIM(v_owner_email)) = v_recipient_email THEN
    RAISE EXCEPTION 'same_email';
  END IF;

  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  IF p_expires_at IS NULL OR p_expires_at <= NOW() THEN
    RAISE EXCEPTION 'invalid_expires_at';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = p_restaurant_id
      AND r.user_id = v_owner_id
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  PERFORM public.menulia_user_email_exists(v_recipient_email);

  DELETE FROM public.restaurant_transfers
  WHERE restaurant_id = p_restaurant_id;

  INSERT INTO public.restaurant_transfers (
    restaurant_id,
    token,
    recipient_email,
    expires_at
  ) VALUES (
    p_restaurant_id,
    TRIM(p_token),
    v_recipient_email,
    p_expires_at
  )
  RETURNING * INTO v_transfer;

  RETURN NEXT v_transfer;
END;
$$;

REVOKE ALL ON FUNCTION public.initiate_restaurant_transfer(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initiate_restaurant_transfer(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

NOTIFY pgrst, 'reload schema';
