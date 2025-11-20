import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, History } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function PushNotificationManager() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'android' | 'ios'>('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    android: 0,
    ios: 0,
    web: 0,
    withPWA: 0,
  });

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('push_notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setHistory(data);
    }
  };

  const loadStats = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('platform, pwa_installed');
    
    if (profiles) {
      const android = profiles.filter(p => p.platform === 'android').length;
      const ios = profiles.filter(p => p.platform === 'ios').length;
      const web = profiles.filter(p => !p.platform || p.platform === 'web').length;
      const withPWA = profiles.filter(p => p.pwa_installed).length;
      
      setStats({ android, ios, web, withPWA });
    }
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSending(true);
    try {
      // Get target users based on platform
      let query = supabase
        .from('profiles')
        .select('id, push_token, platform');
      
      if (target === 'android') {
        query = query.eq('platform', 'android');
      } else if (target === 'ios') {
        query = query.eq('platform', 'ios');
      }
      
      const { data: targetUsers } = await query.not('push_token', 'is', null);
      
      if (!targetUsers || targetUsers.length === 0) {
        toast.error('Nenhum usuário encontrado com token de notificação');
        setSending(false);
        return;
      }

      // Extract tokens
      const tokens = targetUsers.map(user => user.push_token).filter(Boolean) as string[];

      // Log notification in history
      const { data: notification } = await supabase
        .from('push_notifications')
        .insert({
          title,
          body,
          target,
          sent_count: tokens.length,
        })
        .select()
        .single();

      if (!notification) {
        throw new Error('Failed to log notification');
      }

      // Send push notification via edge function
      const { data, error: sendError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          notificationId: notification.id,
          title,
          body,
          tokens,
        },
      });

      if (sendError) {
        throw sendError;
      }

      console.log('Push notification result:', data);

      toast.success(`Notificação enviada para ${data.successCount || tokens.length} usuários`, {
        description: data.failureCount > 0 ? `${data.failureCount} falharam` : 'Todas enviadas com sucesso',
      });

      // Clear form
      setTitle('');
      setBody('');
      setTarget('all');
      
      // Reload history
      loadHistory();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação', {
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'all': return 'Todos';
      case 'android': return 'Android';
      case 'ios': return 'iOS';
      default: return target;
    }
  };

  const getTargetBadgeVariant = (target: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (target) {
      case 'android': return 'default';
      case 'ios': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Android</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.android}</div>
            <p className="text-xs text-muted-foreground">usuários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">iOS</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.ios}</div>
            <p className="text-xs text-muted-foreground">usuários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.web}</div>
            <p className="text-xs text-muted-foreground">usuários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PWA Instalado</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.withPWA}</div>
            <p className="text-xs text-muted-foreground">usuários</p>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Notificação Push
          </CardTitle>
          <CardDescription>
            Configure e envie notificações para usuários com PWA instalado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Plataforma Alvo</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as any)}>
              <SelectTrigger id="target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                <SelectItem value="android">Apenas Android</SelectItem>
                <SelectItem value="ios">Apenas iOS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título da Notificação</Label>
            <Input
              id="title"
              placeholder="Ex: Nova atualização disponível!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/50 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensagem</Label>
            <Textarea
              id="body"
              placeholder="Ex: Confira as novidades e crie vídeos ainda mais incríveis!"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/200 caracteres
            </p>
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={sending || !title || !body}
            className="w-full"
          >
            {sending ? 'Enviando...' : 'Enviar Notificação'}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Notificações
          </CardTitle>
          <CardDescription>
            Últimas 10 notificações enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma notificação enviada ainda
                  </TableCell>
                </TableRow>
              ) : (
                history.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="font-medium">{notif.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{notif.body}</TableCell>
                    <TableCell>
                      <Badge variant={getTargetBadgeVariant(notif.target)}>
                        {getTargetLabel(notif.target)}
                      </Badge>
                    </TableCell>
                    <TableCell>{notif.sent_count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(notif.sent_at).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}