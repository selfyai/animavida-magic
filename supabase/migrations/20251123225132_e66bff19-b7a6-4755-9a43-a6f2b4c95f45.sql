-- Add status column to credit_transactions table
ALTER TABLE public.credit_transactions 
ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled'));

-- Update existing purchase transactions to paid status (assuming they were all completed)
UPDATE public.credit_transactions 
SET status = 'paid' 
WHERE type = 'purchase';

-- Update existing bonus and usage transactions to paid status
UPDATE public.credit_transactions 
SET status = 'paid' 
WHERE type IN ('bonus', 'usage');

-- Add index for better query performance
CREATE INDEX idx_credit_transactions_status ON public.credit_transactions(status);

COMMENT ON COLUMN public.credit_transactions.status IS 'Status da transação: pending (aguardando), paid (pago), failed (falhou), cancelled (cancelado)';