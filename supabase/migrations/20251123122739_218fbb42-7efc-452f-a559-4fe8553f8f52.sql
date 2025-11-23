-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can view enabled voices" ON public.voice_settings;

-- Create a more permissive policy for viewing enabled voices
CREATE POLICY "Public can view enabled voices"
  ON public.voice_settings
  FOR SELECT
  TO public
  USING (is_enabled = true);