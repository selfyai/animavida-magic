-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.check_signup_rate_limit(check_ip TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_signup_attempt(attempt_ip TEXT, was_success BOOLEAN)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.signup_attempts (ip_address, success, attempted_at)
  VALUES (attempt_ip, was_success, now());
END;
$$;