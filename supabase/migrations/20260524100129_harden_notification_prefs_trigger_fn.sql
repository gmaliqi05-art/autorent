CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_notification_prefs_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_notification_prefs_updated_at() FROM anon, authenticated;;\n