-- Fix generated_videos table - Remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all shared videos" ON public.generated_videos;

-- Fix credit_transactions table - Add explicit authentication requirement
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;

CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));