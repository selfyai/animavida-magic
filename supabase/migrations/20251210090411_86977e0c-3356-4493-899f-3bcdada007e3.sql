-- Adicionar políticas RESTRICTIVE para bloquear acesso anônimo em TODAS as tabelas

-- profiles (PII sensível)
CREATE POLICY "deny_anon_access" ON public.profiles 
FOR ALL USING (auth.role() != 'anon');

-- credit_transactions (dados financeiros)
CREATE POLICY "deny_anon_access" ON public.credit_transactions 
FOR ALL USING (auth.role() != 'anon');

-- generated_videos (conteúdo do usuário)
CREATE POLICY "deny_anon_access" ON public.generated_videos 
FOR ALL USING (auth.role() != 'anon');

-- idea_clicks (dados comportamentais)
CREATE POLICY "deny_anon_access" ON public.idea_clicks 
FOR ALL USING (auth.role() != 'anon');

-- user_roles (controle de acesso)
CREATE POLICY "deny_anon_access" ON public.user_roles 
FOR ALL USING (auth.role() != 'anon');

-- app_settings (configurações do sistema)
CREATE POLICY "deny_anon_access" ON public.app_settings 
FOR ALL USING (auth.role() != 'anon');

-- push_notifications (notificações)
CREATE POLICY "deny_anon_access" ON public.push_notifications 
FOR ALL USING (auth.role() != 'anon');

-- scheduled_notifications (notificações agendadas)
CREATE POLICY "deny_anon_access" ON public.scheduled_notifications 
FOR ALL USING (auth.role() != 'anon');

-- signup_attempts (tentativas de cadastro)
CREATE POLICY "deny_anon_access" ON public.signup_attempts 
FOR ALL USING (auth.role() != 'anon');

-- payment_settings_history (histórico de pagamentos)
CREATE POLICY "deny_anon_access" ON public.payment_settings_history 
FOR ALL USING (auth.role() != 'anon');

-- voice_settings (configurações de voz)
CREATE POLICY "deny_anon_access" ON public.voice_settings 
FOR ALL USING (auth.role() != 'anon');