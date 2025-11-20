import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeaderWithCredits } from '@/components/HeaderWithCredits';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import MobileNav from '@/components/MobileNav';
import { User, History, Bell } from 'lucide-react';

export default function Profile() {
  const { user, loading } = useAuth();
  const { permission, requestPermission } = usePushNotifications(user?.id);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTransactions();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    setProfile(data);
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    setTransactions(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-safe-mobile pt-safe">
      <HeaderWithCredits />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações e histórico</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>Seus dados cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="text-base">{profile?.email}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Nome Completo</div>
                  <div className="text-base">{profile?.full_name || 'Não informado'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Créditos Disponíveis</div>
                  <div className="text-base">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {profile?.credits || 0} créditos
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Membro desde</div>
                  <div className="text-base">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })
                      : '-'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações Push
              </CardTitle>
              <CardDescription>
                Receba atualizações e novidades diretamente no seu dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status das Notificações</p>
                  <p className="text-xs text-muted-foreground">
                    {permission === 'granted' ? 'Ativadas' : 
                     permission === 'denied' ? 'Bloqueadas' : 'Não solicitadas'}
                  </p>
                </div>
                <Button
                  onClick={requestPermission}
                  disabled={permission === 'granted'}
                  variant={permission === 'granted' ? 'outline' : 'default'}
                >
                  {permission === 'granted' ? 'Ativadas' : 'Ativar Notificações'}
                </Button>
              </div>
              
              {permission === 'denied' && (
                <p className="text-xs text-muted-foreground">
                  As notificações foram bloqueadas. Para ativá-las, você precisa alterar as configurações do seu navegador.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Transações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <CardTitle>Histórico de Créditos</CardTitle>
              </div>
              <CardDescription>Todas as suas transações de créditos</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              transaction.type === 'purchase' ? 'default' : 
                              transaction.type === 'bonus' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {transaction.type === 'purchase' ? 'Compra' :
                             transaction.type === 'bonus' ? 'Bônus' :
                             transaction.type === 'admin_add' ? 'Admin +' :
                             transaction.type === 'admin_remove' ? 'Admin -' :
                             transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <PushNotificationPrompt userId={user?.id} />

      <MobileNav />
    </div>
  );
}
