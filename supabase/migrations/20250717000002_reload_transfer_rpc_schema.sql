-- Ensure PostgREST picks up initiate_restaurant_transfer after manual SQL runs

CREATE OR REPLACE FUNCTION public.menulia_user_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
  );
$$;

CREATE OR REPLACE FUNCTION public.initiate_restaurant_transfer(
  p_restaurant_id UUID,
  p_recipient_email TEXT
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
    gen_random_uuid()::text,
    v_recipient_email,
    NOW() + INTERVAL '7 days'
  )
  RETURNING * INTO v_transfer;

  RETURN NEXT v_transfer;
END;
$$;

REVOKE ALL ON FUNCTION public.menulia_user_email_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.menulia_user_email_exists(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.initiate_restaurant_transfer(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initiate_restaurant_transfer(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
