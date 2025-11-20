import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, TestTube, CheckCircle2, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

export function FirebaseConfigManager() {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    projectId: '',
    messagingSenderId: '',
    appId: '',
    vapidKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'firebase_config')
        .maybeSingle();

      if (data?.value) {
        const savedConfig = data.value as any;
        setConfig({
          apiKey: savedConfig.apiKey || '',
          projectId: savedConfig.projectId || '',
          messagingSenderId: savedConfig.messagingSenderId || '',
          appId: savedConfig.appId || '',
          vapidKey: savedConfig.vapidKey || '',
        });
      }
    } catch (error) {
      console.error('Error loading Firebase config:', error);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Check if config already exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'firebase_config')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('app_settings')
          .update({
            value: config as any,
            description: 'Firebase Cloud Messaging configuration',
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'firebase_config');

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_settings')
          .insert([{
            key: 'firebase_config',
            value: config as any,
            description: 'Firebase Cloud Messaging configuration',
          }]);

        if (error) throw error;
      }

      toast.success('Configuração salva com sucesso!', {
        description: 'Recarregue a página para aplicar as mudanças',
      });
    } catch (error: any) {
      toast.error('Erro ao salvar configuração', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!config.apiKey || !config.projectId) {
      toast.error('Configure pelo menos API Key e Project ID para testar');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test Firebase initialization
      const testResponse = await fetch(
        `https://firebase.googleapis.com/v1alpha/projects/${config.projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
        }
      );

      if (testResponse.ok) {
        setTestResult({
          success: true,
          message: 'Conexão com Firebase estabelecida com sucesso!',
        });
        toast.success('Teste bem-sucedido!');
      } else {
        setTestResult({
          success: false,
          message: 'Não foi possível conectar ao Firebase. Verifique suas credenciais.',
        });
        toast.error('Falha no teste de conexão');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao testar conexão. Verifique suas credenciais.',
      });
      toast.error('Erro no teste de conexão');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure as credenciais do Firebase Cloud Messaging para habilitar notificações push.
          Você pode obter essas informações no{' '}
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Firebase Console
          </a>
          .
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>📋 Guia de Configuração</CardTitle>
          <CardDescription>Siga estes passos para configurar o Firebase</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>
                Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a> e crie um novo projeto (ou selecione um existente)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>
                Clique em "Adicionar app" e escolha a plataforma Web (ícone {'</>'})
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>
                Registre seu app e copie as credenciais mostradas (apiKey, projectId, messagingSenderId, appId)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>
                No menu lateral, vá em "Projeto" → "Configurações do projeto" → "Cloud Messaging"
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">5.</span>
              <span>
                Na seção "Configuração da Web", clique em "Gerar par de chaves" para obter a VAPID Key
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">6.</span>
              <span>
                Cole todas as credenciais nos campos abaixo e clique em "Salvar"
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do Firebase
          </CardTitle>
          <CardDescription>
            Configure as credenciais do Firebase para habilitar notificações push
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIzaSy..."
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">
              Project ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectId"
              placeholder="my-project-id"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messagingSenderId">
              Messaging Sender ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="messagingSenderId"
              placeholder="123456789012"
              value={config.messagingSenderId}
              onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appId">
              App ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appId"
              placeholder="1:123456789012:web:abcdef123456"
              value={config.appId}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vapidKey">VAPID Key (opcional)</Label>
            <Textarea
              id="vapidKey"
              placeholder="BNxxx..."
              value={config.vapidKey}
              onChange={(e) => setConfig({ ...config, vapidKey: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Chave pública VAPID para Web Push (necessário para navegadores web)
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
            <Button
              onClick={handleTest}
              disabled={testing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como obter as credenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. Acesse o Firebase Console</h4>
            <p className="text-muted-foreground">
              Vá para{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                console.firebase.google.com
              </a>{' '}
              e selecione seu projeto
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Configurações do Projeto</h4>
            <p className="text-muted-foreground">
              Clique no ícone de engrenagem ao lado de "Visão geral do projeto" e selecione
              "Configurações do projeto"
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Adicione um app Web</h4>
            <p className="text-muted-foreground">
              Na seção "Seus apps", adicione um app Web e copie as credenciais do SDK
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. VAPID Key</h4>
            <p className="text-muted-foreground">
              Vá para "Cloud Messaging" na aba de configurações e gere um par de chaves Web Push
              (VAPID)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
