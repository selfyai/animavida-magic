-- Adicionar políticas de DELETE para admins

-- Permitir admins excluírem usuários
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir admins excluírem vídeos
CREATE POLICY "Admins can delete videos"
ON public.generated_videos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir admins excluírem transações
CREATE POLICY "Admins can delete transactions"
ON public.credit_transactions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));