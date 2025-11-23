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
  const [logoUrl, setLogoUrl] = useState<string>('');
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

  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';
    
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const applyColors = (colors: ThemeColors) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      // Se o valor for HEX, converter para HSL
      const hslValue = value.startsWith('#') ? hexToHsl(value) : value;
      root.style.setProperty(cssVar, hslValue);
    });
  };

  return { logoUrl, loading };
};
