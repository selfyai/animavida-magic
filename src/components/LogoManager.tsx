import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Image, Upload } from 'lucide-react';

export const LogoManager = () => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_logo')
        .maybeSingle();

      if (error) throw error;
      
      if (data && typeof data.value === 'object' && data.value !== null) {
        const value = data.value as { url: string };
        setLogoUrl(value.url || '');
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('video-images')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('video-images')
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl;

      // Salvar no app_settings
      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'app_logo',
          value: { url: newLogoUrl },
          description: 'Logo do aplicativo',
        });

      if (settingsError) throw settingsError;

      setLogoUrl(newLogoUrl);
      toast.success('Logo atualizada com sucesso!');
      
      // Recarregar a página para aplicar a nova logo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao atualizar logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo do Sistema
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
          <Image className="h-5 w-5" />
          Logo do Sistema
        </CardTitle>
        <CardDescription>
          Faça upload da logo que aparecerá em todo o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {logoUrl && (
            <div className="flex justify-center p-6 bg-muted/50 rounded-lg">
              <img 
                src={logoUrl} 
                alt="Logo atual" 
                className="max-h-32 object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="logo-upload">Selecionar nova logo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
              />
              <Button disabled={uploading} variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG, JPG, WEBP (máximo 2MB)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
