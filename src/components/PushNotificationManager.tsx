import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, History, FileText, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NOTIFICATION_TEMPLATES = [
  {
    id: 'new-feature',
    name: '🎉 Nova Funcionalidade',
    title: 'Nova funcionalidade disponível!',
    body: 'Confira a mais nova funcionalidade que acabamos de lançar. Acesse agora e experimente!',
  },
  {
    id: 'update',
    name: '🔄 Atualização',
    title: 'Atualização importante',
    body: 'Fizemos melhorias no app para você ter uma experiência ainda melhor. Atualize agora!',
  },
  {
    id: 'promotion',
    name: '🎁 Promoção',
    title: 'Oferta especial para você!',
    body: 'Aproveite nossa promoção exclusiva. Por tempo limitado!',
  },
  {
    id: 'reminder',
    name: '⏰ Lembrete',
    title: 'Não esqueça!',
    body: 'Você tem ações pendentes. Acesse o app e complete suas tarefas.',
  },
  {
    id: 'welcome',
    name: '👋 Boas-vindas',
    title: 'Bem-vindo(a)!',
    body: 'Obrigado por se juntar a nós! Explore todos os recursos disponíveis.',
  },
  {
    id: 'engagement',
    name: '💡 Engajamento',
    title: 'Sentimos sua falta!',
    body: 'Há novidades esperando por você. Volte e descubra o que há de novo!',
  },
];

export function PushNotificationManager() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'android' | 'ios'>('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [stats, setStats] = useState({
    android: 0,
    ios: 0,
    web: 0,
    withPWA: 0,
  });

  const applyTemplate = (templateId: string) => {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setBody(template.body);
      setSelectedTemplate(templateId);
      toast.success('Template aplicado! Personalize antes de enviar.');
    }
  };

  useEffect(() => {
    loadHistory();
    loadStats();
    loadScheduledNotifications();
  }, []);

  const loadScheduledNotifications = async () => {
    const { data } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('is_sent', false)
      .order('scheduled_at', { ascending: true });
    
    if (data) {
      setScheduledNotifications(data);
    }
  };

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

    // Check if scheduling is enabled
    if (scheduleEnabled) {
      if (!scheduleDate || !scheduleTime) {
        toast.error('Preencha a data e hora do agendamento');
        return;
      }

      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduledAt < new Date()) {
        toast.error('A data e hora devem ser no futuro');
        return;
      }

      setSending(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        
        await supabase
          .from('scheduled_notifications')
          .insert({
            title,
            body,
            target,
            scheduled_at: scheduledAt.toISOString(),
            recurrence,
            created_by: user.user?.id,
          });

        toast.success('Notificação agendada com sucesso!');
        
        // Clear form
        setTitle('');
        setBody('');
        setTarget('all');
        setScheduleEnabled(false);
        setScheduleDate('');
        setScheduleTime('');
        setRecurrence('none');
        setSelectedTemplate('');
        
        loadScheduledNotifications();
      } catch (error: any) {
        console.error('Error scheduling notification:', error);
        toast.error('Erro ao agendar notificação', {
          description: error.message,
        });
      } finally {
        setSending(false);
      }
      return;
    }

    // Immediate send logic (existing code)
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
      setSelectedTemplate('');
      
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

  const handleDeleteScheduled = async (id: string) => {
    try {
      await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);

      toast.success('Agendamento cancelado');
      loadScheduledNotifications();
    } catch (error: any) {
      console.error('Error deleting scheduled notification:', error);
      toast.error('Erro ao cancelar agendamento');
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

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case 'none': return 'Única';
      case 'daily': return 'Diária';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return recurrence;
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

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates de Notificação
          </CardTitle>
          <CardDescription>
            Selecione um template pré-configurado e personalize conforme necessário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {NOTIFICATION_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 text-left whitespace-normal"
                onClick={() => applyTemplate(template.id)}
              >
                <span className="font-semibold">{template.name}</span>
                <span className="text-xs opacity-70 line-clamp-2">{template.body}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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

          {/* Scheduling Options */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="schedule">Agendar Envio</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar em uma data e hora específicas
                </p>
              </div>
              <Switch
                id="schedule"
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>

            {scheduleEnabled && (
              <div className="space-y-3 pl-4 border-l-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate">Data</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Hora</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recorrência</Label>
                  <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                    <SelectTrigger id="recurrence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Apenas uma vez</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={sending || !title || !body}
            className="w-full"
          >
            {sending ? (scheduleEnabled ? 'Agendando...' : 'Enviando...') : (scheduleEnabled ? 'Agendar Notificação' : 'Enviar Agora')}
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled Notifications */}
      {scheduledNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Notificações Agendadas
            </CardTitle>
            <CardDescription>
              {scheduledNotifications.length} notificações aguardando envio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Recorrência</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledNotifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="font-medium">{notif.title}</TableCell>
                    <TableCell>
                      {format(new Date(notif.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTargetBadgeVariant(notif.target)}>
                        {getTargetLabel(notif.target)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRecurrenceLabel(notif.recurrence)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteScheduled(notif.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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