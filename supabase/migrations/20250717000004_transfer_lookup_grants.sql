-- Ensure public transfer preview RPC is callable by anonymous claim page lookups

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
  WHERE t.token = TRIM(p_token)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_restaurant_transfer_preview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_restaurant_transfer_preview(TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
