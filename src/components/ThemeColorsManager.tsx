import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Palette } from 'lucide-react';

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

const defaultColors: ThemeColors = {
  background: '#101419',
  foreground: '#F5F8FA',
  primary: '#1DB4E7',
  primaryForeground: '#101419',
  secondary: '#21272E',
  secondaryForeground: '#F5F8FA',
  accent: '#1DB4E7',
  accentForeground: '#101419',
  muted: '#21272E',
  mutedForeground: '#9BA8B6',
  card: '#171C22',
  cardForeground: '#F5F8FA',
  border: '#21272E',
  input: '#1A1F25',
  ring: '#1DB4E7',
};

export const ThemeColorsManager = () => {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'theme_colors')
        .maybeSingle();

      if (error) throw error;
      
      if (data && typeof data.value === 'object' && data.value !== null) {
        setColors(data.value as unknown as ThemeColors);
      }
    } catch (error) {
      console.error('Erro ao carregar cores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'theme_colors',
          value: colors as any,
          description: 'Cores do tema do aplicativo',
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('Cores salvas com sucesso!');
      
      // Aplicar as cores no CSS convertendo HEX para HSL
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const hslValue = hexToHsl(value);
        root.style.setProperty(cssVar, hslValue);
      });
      
      // Recarregar para garantir que tudo foi aplicado
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao salvar cores:', error);
      toast.error('Erro ao salvar cores');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setColors(defaultColors);
    toast.info('Cores restauradas para o padrão');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores do Tema
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const colorFields: { key: keyof ThemeColors; label: string; description: string }[] = [
    { key: 'background', label: 'Fundo da Página', description: 'Cor de fundo principal do aplicativo' },
    { key: 'foreground', label: 'Cor do Texto', description: 'Cor do texto em geral' },
    { key: 'primary', label: 'Cor dos Botões', description: 'Cor principal dos botões e links' },
    { key: 'primaryForeground', label: 'Texto dos Botões', description: 'Cor do texto dentro dos botões' },
    { key: 'card', label: 'Fundo do Menu/Cards', description: 'Cor de fundo do menu e cards' },
    { key: 'border', label: 'Cor das Bordas', description: 'Cor das linhas e separadores' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Cores do Tema
        </CardTitle>
        <CardDescription>
          Personalize as cores principais do seu aplicativo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {colorFields.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-10 h-10 rounded border border-border flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: colors[key] }}
                      aria-label={`Selecionar cor para ${label}`}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 bg-card" align="start">
                    <div className="flex flex-col gap-3">
                      <Label className="text-sm font-medium">{label}</Label>
                      
                      {/* Seletor de cores nativo */}
                      <input
                        type="color"
                        value={colors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-full h-24 cursor-pointer rounded border border-border"
                      />
                      
                      {/* Paleta de cores sugeridas */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Cores Sugeridas:</p>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            '#101419', '#1A1F25', '#21272E', '#171C22', // Escuros
                            '#F5F8FA', '#FFFFFF', '#E5E7EB', '#D1D5DB', // Claros
                            '#1DB4E7', '#0EA5E9', '#3B82F6', '#2563EB', // Azuis
                            '#10B981', '#059669', '#22C55E', '#16A34A', // Verdes
                            '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', // Outros
                            '#6B7280', '#9BA8B6', '#4B5563', '#374151', // Cinzas
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorChange(key, color)}
                              className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground text-center font-mono">{colors[key]}</p>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex-1">
                  <Input
                    id={key}
                    value={colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    placeholder="#101419"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Salvando...' : 'Salvar Cores'}
          </Button>
          <Button onClick={handleReset} variant="outline">
            Restaurar Padrão
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Dica:</strong> Use o formato HEX para as cores.
            Exemplo: "#1DB4E7" para um azul vibrante. Você pode usar qualquer seletor de cores online para obter o código.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
