-- Adicionar constraint única para evitar transações duplicadas
-- Primeiro, criar um índice único baseado em uma parte da descrição que contém o payment_id
CREATE UNIQUE INDEX idx_credit_transactions_unique_payment 
ON public.credit_transactions (user_id, payment_provider, payment_method, type, description)
WHERE type = 'purchase' AND payment_provider IS NOT NULL;

COMMENT ON INDEX idx_credit_transactions_unique_payment IS 'Previne transações de compra duplicadas do mesmo pagamento';