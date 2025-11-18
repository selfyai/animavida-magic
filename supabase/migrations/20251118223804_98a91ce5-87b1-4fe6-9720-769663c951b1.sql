-- Adicionar campo de CPF/CNPJ na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tax_id TEXT;