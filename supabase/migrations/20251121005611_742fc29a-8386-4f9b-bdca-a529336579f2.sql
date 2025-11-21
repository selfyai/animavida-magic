-- Remove policy that allows anyone to view videos
DROP POLICY IF EXISTS "Anyone can view videos via shared link" ON public.generated_videos;

-- Create new policy that only allows authenticated users to view all videos
CREATE POLICY "Authenticated users can view all shared videos"
ON public.generated_videos
FOR SELECT
TO authenticated
USING (true);