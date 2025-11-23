import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, CreditCard } from "lucide-react";

export const PaymentSettingsManager = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_api_key')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setApiKey(data.value as string);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "A API Key não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'payment_api_key',
          value: apiKey,
          description: 'API Key do meio de pagamento (AbacatePay)'
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações de pagamento atualizadas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configurações de Pagamento
        </CardTitle>
        <CardDescription>
          Configure o meio de pagamento utilizado no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-provider">Provedor de Pagamento</Label>
          <Input
            id="payment-provider"
            value="AbacatePay (PIX)"
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Atualmente utilizando AbacatePay para pagamentos via PIX
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Key do AbacatePay
          </Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua API Key do AbacatePay"
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta chave é usada para criar cobranças PIX. Obtenha sua API Key no{" "}
            <a
              href="https://abacatepay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              painel do AbacatePay
            </a>
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </Button>
          <Button variant="outline" onClick={loadSettings} disabled={saving}>
            Recarregar
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">⚠️ Importante:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>A API Key é armazenada de forma segura no banco de dados</li>
            <li>Alterar a API Key afeta todos os novos pagamentos</li>
            <li>Pagamentos em andamento não são afetados</li>
            <li>Mantenha sua API Key em sigilo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
