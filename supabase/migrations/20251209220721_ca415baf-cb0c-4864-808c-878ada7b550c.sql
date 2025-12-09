-- Inserir configuração de crédito inicial
INSERT INTO public.app_settings (key, value, description)
VALUES ('initial_credit_enabled', '{"enabled": true, "amount": 1}', 'Controla se novos usuários recebem crédito inicial')
ON CONFLICT (key) DO NOTHING;

-- Atualizar função handle_new_user para verificar configuração
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  initial_credit_settings jsonb;
  credit_enabled boolean;
  credit_amount integer;
BEGIN
  -- Buscar configuração de crédito inicial
  SELECT value INTO initial_credit_settings
  FROM public.app_settings
  WHERE key = 'initial_credit_enabled';
  
  -- Verificar se está habilitado (padrão: true se não existir)
  credit_enabled := COALESCE((initial_credit_settings->>'enabled')::boolean, true);
  credit_amount := COALESCE((initial_credit_settings->>'amount')::integer, 1);
  
  -- Criar perfil
  IF credit_enabled THEN
    INSERT INTO public.profiles (id, email, credits)
    VALUES (NEW.id, NEW.email, credit_amount);
    
    INSERT INTO public.credit_transactions (user_id, amount, type, description, status)
    VALUES (NEW.id, credit_amount, 'bonus', 'Crédito inicial de boas-vindas', 'completed');
  ELSE
    INSERT INTO public.profiles (id, email, credits)
    VALUES (NEW.id, NEW.email, 0);
  END IF;
  
  -- Adicionar role de usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;