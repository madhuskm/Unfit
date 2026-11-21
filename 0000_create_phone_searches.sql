CREATE TABLE public.phone_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_searches TO authenticated;
GRANT ALL ON public.phone_searches TO service_role;
ALTER TABLE public.phone_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.phone_searches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.phone_searches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.phone_searches FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.phone_searches FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ON public.phone_searches (user_id, created_at DESC);