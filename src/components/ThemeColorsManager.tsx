import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  background: '220 18% 8%',
  foreground: '210 40% 98%',
  primary: '195 92% 56%',
  primaryForeground: '220 18% 8%',
  secondary: '220 15% 18%',
  secondaryForeground: '210 40% 98%',
  accent: '195 92% 56%',
  accentForeground: '220 18% 8%',
  muted: '220 15% 18%',
  mutedForeground: '215 20.2% 65.1%',
  card: '220 15% 12%',
  cardForeground: '210 40% 98%',
  border: '220 15% 18%',
  input: '220 15% 15%',
  ring: '195 92% 56%',
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
      
      // Aplicar as cores no CSS
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(cssVar, value);
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
    { key: 'background', label: 'Background', description: 'Cor de fundo principal' },
    { key: 'foreground', label: 'Foreground', description: 'Cor do texto principal' },
    { key: 'primary', label: 'Primary', description: 'Cor primária (botões, links)' },
    { key: 'primaryForeground', label: 'Primary Foreground', description: 'Texto sobre cor primária' },
    { key: 'secondary', label: 'Secondary', description: 'Cor secundária' },
    { key: 'secondaryForeground', label: 'Secondary Foreground', description: 'Texto sobre cor secundária' },
    { key: 'accent', label: 'Accent', description: 'Cor de destaque' },
    { key: 'accentForeground', label: 'Accent Foreground', description: 'Texto sobre cor de destaque' },
    { key: 'muted', label: 'Muted', description: 'Cor suave/desativada' },
    { key: 'mutedForeground', label: 'Muted Foreground', description: 'Texto suave' },
    { key: 'card', label: 'Card', description: 'Fundo dos cards' },
    { key: 'cardForeground', label: 'Card Foreground', description: 'Texto dos cards' },
    { key: 'border', label: 'Border', description: 'Cor das bordas' },
    { key: 'input', label: 'Input', description: 'Fundo dos inputs' },
    { key: 'ring', label: 'Ring', description: 'Cor do anel de foco' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Cores do Tema
        </CardTitle>
        <CardDescription>
          Personalize as cores do sistema (use formato HSL: "H S% L%")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {colorFields.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <div className="flex gap-2 items-center">
                <div 
                  className="w-10 h-10 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: `hsl(${colors[key]})` }}
                />
                <div className="flex-1">
                  <Input
                    id={key}
                    value={colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    placeholder="220 18% 8%"
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
            <strong>Dica:</strong> As cores devem estar no formato HSL (Hue, Saturation, Lightness).
            Exemplo: "195 92% 56%" representa um azul ciano vibrante.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
