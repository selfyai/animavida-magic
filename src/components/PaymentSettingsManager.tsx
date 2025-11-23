import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, CreditCard, CheckCircle2, AlertCircle, History, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PaymentProvider = "abacatepay" | "stripe" | "mercadopago";

interface ProviderConfig {
  apiKey: string;
  [key: string]: string;
}

interface PaymentSettings {
  activeProvider: PaymentProvider;
  providers: {
    [key in PaymentProvider]?: ProviderConfig;
  };
}

interface HistoryEntry {
  id: string;
  created_at: string;
  changed_by: string;
  provider: string;
  action: string;
  previous_provider: string | null;
  metadata: any;
}

export const PaymentSettingsManager = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeProvider, setActiveProvider] = useState<PaymentProvider>("abacatepay");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  const providerInfo = {
    abacatepay: {
      name: "AbacatePay (PIX)",
      fields: [{ key: "apiKey", label: "API Key", type: "password" }],
      docs: "https://abacatepay.com",
    },
    stripe: {
      name: "Stripe",
      fields: [{ key: "apiKey", label: "Secret Key", type: "password" }],
      docs: "https://stripe.com/docs",
    },
    mercadopago: {
      name: "Mercado Pago",
      fields: [{ key: "apiKey", label: "Access Token", type: "password" }],
      docs: "https://www.mercadopago.com.br/developers",
    },
  };

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        const settings = data.value as unknown as PaymentSettings;
        setActiveProvider(settings.activeProvider || "abacatepay");
        
        const providerConfig = settings.providers[settings.activeProvider || "abacatepay"];
        if (providerConfig?.apiKey) {
          setApiKey(providerConfig.apiKey);
        }
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

  const handleProviderChange = async (provider: PaymentProvider) => {
    setActiveProvider(provider);
    setApiKey("");
    
    // Load existing config for this provider
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();

      if (data?.value) {
        const settings = data.value as unknown as PaymentSettings;
        const providerConfig = settings.providers[provider];
        if (providerConfig?.apiKey) {
          setApiKey(providerConfig.apiKey);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do provedor:', error);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payment_settings_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveToHistory = async (previousProvider: PaymentProvider) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('payment_settings_history')
        .insert({
          changed_by: user.id,
          provider: activeProvider,
          action: previousProvider !== activeProvider ? 'provider_changed' : 'api_key_updated',
          previous_provider: previousProvider !== activeProvider ? previousProvider : null,
          metadata: {
            provider_name: providerInfo[activeProvider].name,
            has_api_key: !!apiKey
          }
        });
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  const saveSettings = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: `${providerInfo[activeProvider].fields[0].label} não pode estar vazia.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Get existing settings first
      const { data: existingData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();

      const existingSettings: PaymentSettings = existingData?.value as unknown as PaymentSettings || {
        activeProvider: "abacatepay",
        providers: {},
      };

      const previousProvider = existingSettings.activeProvider;

      // Update with new configuration
      const newSettings: PaymentSettings = {
        activeProvider,
        providers: {
          ...existingSettings.providers,
          [activeProvider]: {
            apiKey,
          },
        },
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'payment_settings',
          value: newSettings as any,
          description: 'Configurações dos provedores de pagamento'
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      // Save to history
      await saveToHistory(previousProvider);
      
      // Reload history
      await loadHistory();

      toast({
        title: "Sucesso",
        description: `${providerInfo[activeProvider].name} configurado como provedor ativo!`,
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
          Configure o provedor de pagamento ativo no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status do Provedor Ativo */}
        <Alert className="border-primary/50 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Provedor Ativo:</span>
              <Badge variant="default" className="text-sm">
                {providerInfo[activeProvider].name}
              </Badge>
              {!apiKey && (
                <Badge variant="destructive" className="text-xs">
                  Não configurado
                </Badge>
              )}
              {apiKey && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Configurado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Este provedor será usado para processar todos os pagamentos dos usuários
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="payment-provider">Provedor de Pagamento Ativo</Label>
          <Select value={activeProvider} onValueChange={handleProviderChange as (value: string) => void}>
            <SelectTrigger id="payment-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abacatepay">
                <div className="flex items-center gap-2">
                  <span>AbacatePay (PIX)</span>
                  {activeProvider === "abacatepay" && (
                    <Badge variant="default" className="text-xs">ATIVO</Badge>
                  )}
                </div>
              </SelectItem>
              <SelectItem value="stripe">
                <div className="flex items-center gap-2">
                  <span>Stripe</span>
                  {activeProvider === "stripe" && (
                    <Badge variant="default" className="text-xs">ATIVO</Badge>
                  )}
                </div>
              </SelectItem>
              <SelectItem value="mercadopago">
                <div className="flex items-center gap-2">
                  <span>Mercado Pago</span>
                  {activeProvider === "mercadopago" && (
                    <Badge variant="default" className="text-xs">ATIVO</Badge>
                  )}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            O provedor selecionado será usado para processar todos os pagamentos
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Configuração: {providerInfo[activeProvider].name}
          </h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">
                {providerInfo[activeProvider].fields[0].label}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Digite sua ${providerInfo[activeProvider].fields[0].label}`}
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
                Obtenha suas credenciais em{" "}
                <a
                  href={providerInfo[activeProvider].docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {providerInfo[activeProvider].docs}
                </a>
              </p>
            </div>
          </div>
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

        {/* Histórico de Alterações */}
        <div className="pt-4 border-t">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="font-medium">Histórico de Alterações</span>
                  {history.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {history.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma alteração registrada ainda
                  </p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {entry.action === 'provider_changed' ? 'Provedor Alterado' : 'Credenciais Atualizadas'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm">
                            {entry.action === 'provider_changed' ? (
                              <>
                                Provedor alterado de{' '}
                                <span className="font-medium">
                                  {entry.previous_provider ? providerInfo[entry.previous_provider as PaymentProvider]?.name : 'N/A'}
                                </span>
                                {' '}para{' '}
                                <span className="font-medium text-primary">
                                  {providerInfo[entry.provider as PaymentProvider]?.name}
                                </span>
                              </>
                            ) : (
                              <>
                                Credenciais atualizadas para{' '}
                                <span className="font-medium text-primary">
                                  {providerInfo[entry.provider as PaymentProvider]?.name}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">⚠️ Importante:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>As credenciais são armazenadas de forma segura no banco de dados</li>
            <li>Alterar o provedor ou credenciais afeta apenas novos pagamentos</li>
            <li>Pagamentos em andamento não são afetados pela troca de provedor</li>
            <li>Você pode configurar múltiplos provedores e alternar entre eles</li>
            <li>Mantenha suas credenciais em sigilo</li>
            <li>Todas as alterações são registradas no histórico para auditoria</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
