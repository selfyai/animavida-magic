-- Habilitar realtime para a tabela credit_transactions
ALTER TABLE credit_transactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_transactions;