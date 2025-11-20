-- Add columns to profiles table for platform tracking and push notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS push_token text,
ADD COLUMN IF NOT EXISTS pwa_installed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_platform_update timestamp with time zone DEFAULT now();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_platform ON public.profiles(platform);
CREATE INDEX IF NOT EXISTS idx_profiles_pwa_installed ON public.profiles(pwa_installed);

-- Create table for push notifications history
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  target text NOT NULL, -- 'all', 'android', 'ios'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on push_notifications
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage push notifications
CREATE POLICY "Admins can manage push notifications"
ON public.push_notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

COMMENT ON COLUMN public.profiles.platform IS 'User platform: ios, android, web';
COMMENT ON COLUMN public.profiles.push_token IS 'FCM token for push notifications';
COMMENT ON COLUMN public.profiles.pwa_installed IS 'Whether user has PWA installed';
COMMENT ON TABLE public.push_notifications IS 'History of sent push notifications';