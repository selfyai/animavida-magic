import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Settings, Gift } from 'lucide-react';

export const AppSettingsManager = () => {
  const [galleryEnabled, setGalleryEnabled] = useState(true);
  const [initialCreditEnabled, setInitialCreditEnabled] = useState(true);
  const [initialCreditAmount, setInitialCreditAmount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['gallery_button_enabled', 'initial_credit_enabled']);

      if (error) throw error;
      
      data?.forEach((setting) => {
        if (setting.key === 'gallery_button_enabled' && typeof setting.value === 'object' && setting.value !== null) {
          const value = setting.value as { enabled: boolean };
          setGalleryEnabled(value.enabled);
        }
        if (setting.key === 'initial_credit_enabled' && typeof setting.value === 'object' && setting.value !== null) {
          const value = setting.value as { enabled: boolean; amount: number };
          setInitialCreditEnabled(value.enabled);
          setInitialCreditAmount(value.amount || 1);
        }
      });
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

  const updateInitialCreditSetting = async (enabled: boolean, amount?: number) => {
    try {
      const newAmount = amount ?? initialCreditAmount;
      const { error } = await supabase
        .from('app_settings')
        .update({ value: { enabled, amount: newAmount } })
        .eq('key', 'initial_credit_enabled');

      if (error) throw error;

      setInitialCreditEnabled(enabled);
      if (amount !== undefined) {
        setInitialCreditAmount(amount);
      }
      
      toast.success(
        enabled 
          ? `Crédito inicial ativado (${newAmount} crédito${newAmount > 1 ? 's' : ''})` 
          : 'Crédito inicial desativado'
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
        
        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="credit-toggle" className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Crédito Inicial
              </Label>
              <p className="text-sm text-muted-foreground">
                Novos usuários recebem crédito grátis ao criar conta
              </p>
            </div>
            <Switch
              id="credit-toggle"
              checked={initialCreditEnabled}
              onCheckedChange={(enabled) => updateInitialCreditSetting(enabled)}
            />
          </div>
          
          {initialCreditEnabled && (
            <div className="mt-4 flex items-center gap-3">
              <Label htmlFor="credit-amount" className="text-sm text-muted-foreground whitespace-nowrap">
                Quantidade:
              </Label>
              <Input
                id="credit-amount"
                type="number"
                min={1}
                max={100}
                value={initialCreditAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setInitialCreditAmount(val);
                }}
                onBlur={() => updateInitialCreditSetting(initialCreditEnabled, initialCreditAmount)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                crédito{initialCreditAmount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
