CREATE SCHEMA IF NOT EXISTS private;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated;