
-- 1) Drop obsolete bootstrap function (admin is provisioned via server-side seed)
DROP FUNCTION IF EXISTS public.claim_admin();

-- 2) Create a private schema for internal SECURITY DEFINER helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 3) Move has_role out of the exposed API schema
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 4) Move get_incident_by_code into private; expose a SECURITY INVOKER wrapper in public
ALTER FUNCTION public.get_incident_by_code(text) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.get_incident_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_incident_by_code(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_incident_by_code(_code text)
RETURNS TABLE (
  tracking_code text,
  name text,
  class_teacher text,
  class_name text,
  problem text,
  witness text,
  reply text,
  replied_at timestamptz,
  is_blocked boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_incident_by_code(_code);
$$;

REVOKE ALL ON FUNCTION public.get_incident_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_incident_by_code(text) TO anon, authenticated, service_role;
