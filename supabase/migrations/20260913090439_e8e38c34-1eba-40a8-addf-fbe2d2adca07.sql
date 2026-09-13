CREATE TABLE public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  event text NOT NULL CHECK (event IN ('sign_in_success', 'sign_in_failed')),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.login_logs TO anon, authenticated;
GRANT SELECT, DELETE ON public.login_logs TO authenticated;
GRANT ALL ON public.login_logs TO service_role;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sign in attempts can be recorded"
ON public.login_logs FOR INSERT TO anon, authenticated
WITH CHECK (event IN ('sign_in_success', 'sign_in_failed'));
CREATE POLICY "admins can read login logs"
ON public.login_logs FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins can delete login logs"
ON public.login_logs FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));