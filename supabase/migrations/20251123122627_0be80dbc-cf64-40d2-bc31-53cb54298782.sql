-- Create table for voice management
CREATE TABLE IF NOT EXISTS public.voice_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id text NOT NULL UNIQUE,
  voice_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read enabled voices
CREATE POLICY "Anyone can view enabled voices"
  ON public.voice_settings
  FOR SELECT
  USING (is_enabled = true);

-- Only admins can manage voice settings
CREATE POLICY "Admins can manage voice settings"
  ON public.voice_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert all available voices with enabled status
INSERT INTO public.voice_settings (voice_id, voice_name, is_enabled) VALUES
  ('pNInz6obpgDQGcFmaJgB', 'Adalberto', true),
  ('nbk2esDn4RRk4cVDdoiE', 'Aline', true),
  ('ZF6FPAbjXT4488VcRRnw', 'Amélia', true),
  ('9EU0h6CVtEDS6vriwwq5', 'Andréa', true),
  ('ZkXXWlhJO3CtSXof2ujN', 'Ana Vitória', true),
  ('BY77WcifAQZkoI7EftFd', 'Vanessa', true),
  ('qNkzaJoHLLdpvgh5tISm', 'Bruno', true),
  ('txtf1EDouKke753vN8SL', 'Camila', true),
  ('IHngRooVccHyPqB4uQkG', 'Clemente', true),
  ('AnvlJBAqSLDzEevYr9Ap', 'Emanuela', true),
  ('BZc8d1MPTdZkyGbE9Sin', 'Francisca', true),
  ('JBFqnCBsd6RMkjVDRZzb', 'Jorge', true),
  ('fzDFBB4mgvMlL36gPXcz', 'Geovani', true),
  ('i4CzbCVWoqvD0P1QJCUL', 'Íris', true),
  ('NOpBlnGInO9m6vDvFkFC', 'João', true),
  ('gAMZphRyrWJnLMDnom6H', 'Kelvin', true),
  ('rCuVrCHOUMY3OwyJBJym', 'Mila', true),
  ('LT7npgnEogysurF7U8GR', 'Rosana', true),
  ('ZRwrL4id6j1HPGFkeCzO', 'Samuel', true),
  ('LtPsVjX1k0Kl4StEMZPK', 'Sofia', true)
ON CONFLICT (voice_id) DO NOTHING;

-- Create trigger to update updated_at
CREATE TRIGGER update_voice_settings_updated_at
  BEFORE UPDATE ON public.voice_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();