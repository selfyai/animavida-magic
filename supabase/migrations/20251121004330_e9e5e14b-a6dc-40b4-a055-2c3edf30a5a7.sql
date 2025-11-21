-- Allow public access to view shared videos
CREATE POLICY "Anyone can view videos via shared link"
ON public.generated_videos
FOR SELECT
TO public
USING (true);