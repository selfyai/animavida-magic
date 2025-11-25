-- Add tracking columns to generated_videos table
ALTER TABLE generated_videos 
ADD COLUMN idea_category text,
ADD COLUMN idea_source text;

-- Create idea_clicks table for tracking clicks even without video generation
CREATE TABLE idea_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  idea_text text NOT NULL,
  idea_category text NOT NULL,
  clicked_at timestamp with time zone DEFAULT now(),
  generated_video boolean DEFAULT false
);

-- Enable RLS on idea_clicks
ALTER TABLE idea_clicks ENABLE ROW LEVEL SECURITY;

-- Users can insert their own clicks
CREATE POLICY "Users can insert their own clicks"
ON idea_clicks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all clicks
CREATE POLICY "Admins can view all clicks"
ON idea_clicks FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own clicks
CREATE POLICY "Users can view their own clicks"
ON idea_clicks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);