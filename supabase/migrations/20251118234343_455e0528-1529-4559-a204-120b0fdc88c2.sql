-- Create table to track signup attempts by IP
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster IP lookups
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_attempted ON public.signup_attempts(ip_address, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view signup attempts
CREATE POLICY "Only admins can view signup attempts"
ON public.signup_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create function to check signup rate limit
CREATE OR REPLACE FUNCTION public.check_signup_rate_limit(check_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count successful signups from this IP in last 24 hours
  SELECT COUNT(*) INTO attempt_count
  FROM public.signup_attempts
  WHERE ip_address = check_ip
    AND success = true
    AND attempted_at > (now() - INTERVAL '24 hours');
  
  -- Allow max 3 signups per IP per 24 hours
  RETURN attempt_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log signup attempt
CREATE OR REPLACE FUNCTION public.log_signup_attempt(attempt_ip TEXT, was_success BOOLEAN)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.signup_attempts (ip_address, success, attempted_at)
  VALUES (attempt_ip, was_success, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;