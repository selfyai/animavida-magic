import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

export const AppSettingsManager = () => {
  const [galleryEnabled, setGalleryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'gallery_button_enabled')
        .single();

      if (error) throw error;
      
      if (data && typeof data.value === 'object' && data.value !== null) {
        const value = data.value as { enabled: boolean };
        setGalleryEnabled(value.enabled);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateGallerySetting = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: { enabled } })
        .eq('key', 'gallery_button_enabled');

      if (error) throw error;

      setGalleryEnabled(enabled);
      toast.success(
        enabled 
          ? 'Botão de Galeria ativado' 
          : 'Botão de Galeria desativado'
      );
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do App
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do App
        </CardTitle>
        <CardDescription>
          Configure o comportamento global do aplicativo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="gallery-toggle" className="text-base">
              Botão de Galeria
            </Label>
            <p className="text-sm text-muted-foreground">
              Permite que usuários façam upload de imagens da galeria
            </p>
          </div>
          <Switch
            id="gallery-toggle"
            checked={galleryEnabled}
            onCheckedChange={updateGallerySetting}
          />
        </div>
      </CardContent>
    </Card>
  );
};
