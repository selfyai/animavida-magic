import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  ring: string;
}

export const useAppSettings = () => {
  const [logoUrl, setLogoUrl] = useState<string>('/src/assets/logo.png');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Carregar logo
      const { data: logoData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_logo')
        .maybeSingle();

      if (logoData && typeof logoData.value === 'object' && logoData.value !== null) {
        const value = logoData.value as { url: string };
        if (value.url) {
          setLogoUrl(value.url);
        }
      }

      // Carregar cores
      const { data: colorsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'theme_colors')
        .maybeSingle();

      if (colorsData && typeof colorsData.value === 'object' && colorsData.value !== null) {
        const colors = colorsData.value as unknown as ThemeColors;
        applyColors(colors);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (colors: ThemeColors) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(cssVar, value);
    });
  };

  return { logoUrl, loading };
};
