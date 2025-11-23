-- Add payment provider and method columns to credit_transactions
ALTER TABLE public.credit_transactions 
ADD COLUMN payment_provider text,
ADD COLUMN payment_method text;

-- Add index for better query performance on filters
CREATE INDEX idx_credit_transactions_provider ON public.credit_transactions(payment_provider);
CREATE INDEX idx_credit_transactions_method ON public.credit_transactions(payment_method);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);