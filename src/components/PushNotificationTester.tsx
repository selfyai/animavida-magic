import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function PushNotificationTester() {
  const [title, setTitle] = useState('Teste de Notificação');
  const [body, setBody] = useState('Esta é uma notificação de teste para verificar se o sistema está funcionando.');
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    setSending(true);
    try {
      // Get current user's token
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.push_token) {
        toast.error('Você precisa ativar as notificações primeiro');
        return;
      }

      // Send test notification
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          notificationId: null,
          title,
          body,
          tokens: [profile.push_token],
        },
      });

      if (error) throw error;

      if (data.successCount > 0) {
        toast.success('Notificação de teste enviada com sucesso!', {
          description: 'Verifique se você recebeu a notificação',
        });
      } else {
        toast.error('Falha ao enviar notificação de teste', {
          description: data.failureCount > 0 ? 'Token pode estar inválido' : 'Erro desconhecido',
        });
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast.error('Erro ao enviar notificação de teste', {
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Testar Notificações
        </CardTitle>
        <CardDescription>
          Envie uma notificação de teste para você mesmo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testTitle">Título</Label>
          <Input
            id="testTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da notificação"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="testBody">Mensagem</Label>
          <Textarea
            id="testBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Corpo da notificação"
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSendTest} 
          disabled={sending || !title || !body}
          className="w-full"
        >
          {sending ? 'Enviando...' : 'Enviar Notificação de Teste'}
        </Button>
      </CardContent>
    </Card>
  );
}
