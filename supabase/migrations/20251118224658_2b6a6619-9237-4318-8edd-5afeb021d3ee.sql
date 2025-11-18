-- Dropar constraint se existir e recriar
ALTER TABLE public.credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

-- Adicionar foreign key para profiles
ALTER TABLE public.credit_transactions
ADD CONSTRAINT credit_transactions_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Fazer o mesmo para generated_videos
ALTER TABLE public.generated_videos
DROP CONSTRAINT IF EXISTS generated_videos_user_id_fkey;

ALTER TABLE public.generated_videos
ADD CONSTRAINT generated_videos_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;