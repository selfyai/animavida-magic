-- Create app_settings table for global configurations
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default gallery button visibility setting
INSERT INTO public.app_settings (key, value, description)
VALUES ('gallery_button_enabled', '{"enabled": true}'::jsonb, 'Controla se o botão de Galeria aparece na captura de imagem')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();