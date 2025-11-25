import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeaderWithCredits } from '@/components/HeaderWithCredits';
import MobileNav from '@/components/MobileNav';
import { Users, Video, Coins, TrendingUp, Filter, Trash2, Settings, Bell, BarChart3 } from 'lucide-react';
import { AdminCreditsManager } from '@/components/AdminCreditsManager';
import { AppSettingsManager } from '@/components/AppSettingsManager';
import { HomePageCMS } from '@/components/HomePageCMS';
import { UsersPlatformChart } from '@/components/UsersPlatformChart';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { LogoManager } from '@/components/LogoManager';
import { ThemeColorsManager } from '@/components/ThemeColorsManager';
import { VoicesManager } from '@/components/VoicesManager';
import { PaymentSettingsManager } from '@/components/PaymentSettingsManager';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Admin() {
  const { user, loading, isAdmin, checkingAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalCredits: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [creditsFilter, setCreditsFilter] = useState<string>('all');
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [videoDateFilter, setVideoDateFilter] = useState<string>('all');
  const [voiceFilter, setVoiceFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [transactionDateFilter, setTransactionDateFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');

  useEffect(() => {
    console.log('🔐 Admin page check:', { loading, checkingAdmin, user: user?.email, isAdmin });
    // Só redireciona se terminou de carregar TUDO (auth + admin check) E não for admin
    if (!loading && !checkingAdmin && user && !isAdmin) {
      console.log('❌ Not admin, redirecting to dashboard');
      navigate('/dashboard');
    } else if (!loading && !checkingAdmin && user && isAdmin) {
      console.log('✅ User is admin, staying on admin page');
    }
  }, [user, isAdmin, loading, checkingAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadStats();
      loadUsers();
      loadVideos();
      loadTransactions();
    }
  }, [user, isAdmin]);

  const loadStats = async () => {
    const [usersData, videosData, creditsData, revenueData] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('generated_videos').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('credits'),
      supabase.from('credit_transactions')
        .select('amount')
        .eq('type', 'purchase'),
    ]);

    const totalCredits = creditsData.data?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;
    const totalRevenue = revenueData.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    setStats({
      totalUsers: usersData.count || 0,
      totalVideos: videosData.count || 0,
      totalCredits,
      totalRevenue,
    });
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    
    setUsers(data || []);
    setFilteredUsers(data || []);
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysMap: { [key: string]: number } = {
        '7': 7,
        '15': 15,
        '30': 30,
      };
      
      if (daysMap[dateFilter]) {
        const daysAgo = new Date(now.getTime() - daysMap[dateFilter] * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(user => new Date(user.created_at) >= daysAgo);
      }
    }

    // Filtro por créditos
    if (creditsFilter === 'many') {
      filtered = filtered.filter(user => user.credits >= 10);
    } else if (creditsFilter === 'few') {
      filtered = filtered.filter(user => user.credits < 10 && user.credits > 0);
    } else if (creditsFilter === 'none') {
      filtered = filtered.filter(user => user.credits === 0);
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [dateFilter, creditsFilter, users]);

  const applyVideoFilters = () => {
    let filtered = [...videos];

    // Filtro por data
    if (videoDateFilter !== 'all') {
      const now = new Date();
      const daysMap: { [key: string]: number } = {
        '7': 7,
        '15': 15,
        '30': 30,
      };
      
      if (daysMap[videoDateFilter]) {
        const daysAgo = new Date(now.getTime() - daysMap[videoDateFilter] * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(video => new Date(video.created_at) >= daysAgo);
      }
    }

    // Filtro por voz
    if (voiceFilter !== 'all') {
      filtered = filtered.filter(video => video.voice_id === voiceFilter);
    }

    setFilteredVideos(filtered);
  };

  useEffect(() => {
    applyVideoFilters();
  }, [videoDateFilter, voiceFilter, videos]);

  const applyTransactionFilters = () => {
    let filtered = [...transactions];

    // Filtro por data
    if (transactionDateFilter !== 'all') {
      const now = new Date();
      const daysMap: { [key: string]: number } = {
        '7': 7,
        '15': 15,
        '30': 30,
      };
      
      if (daysMap[transactionDateFilter]) {
        const daysAgo = new Date(now.getTime() - daysMap[transactionDateFilter] * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(transaction => new Date(transaction.created_at) >= daysAgo);
      }
    }

    // Filtro por tipo
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === transactionTypeFilter);
    }

    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    applyTransactionFilters();
  }, [transactionDateFilter, transactionTypeFilter, transactions]);

  const loadVideos = async () => {
    const { data } = await supabase
      .from('generated_videos')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(200);
    
    setVideos(data || []);
    setFilteredVideos(data || []);
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('credit_transactions')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(200);
    
    setTransactions(data || []);
    setFilteredTransactions(data || []);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao excluir usuário', {
        description: error.message,
      });
    } else {
      toast.success('Usuário excluído com sucesso', {
        description: `${userEmail} foi removido do sistema`,
      });
      loadStats();
      loadUsers();
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    const { error } = await supabase
      .from('generated_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      toast.error('Erro ao excluir vídeo', {
        description: error.message,
      });
    } else {
      toast.success('Vídeo excluído com sucesso');
      loadStats();
      loadVideos();
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const { error } = await supabase
      .from('credit_transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      toast.error('Erro ao excluir transação', {
        description: error.message,
      });
    } else {
      toast.success('Transação excluída com sucesso');
      loadStats();
      loadTransactions();
    }
  };

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Carregando...</div>
          <div className="text-sm text-muted-foreground">Verificando permissões</div>
        </div>
      </div>
    );
  }

  // Se não estiver carregando e não for admin, retorna null (o useEffect vai redirecionar)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-safe-mobile pt-safe">
      <HeaderWithCredits />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-1">Gerencie usuários, vídeos e transações da plataforma</p>
          </div>
          <Button onClick={() => navigate('/reports')} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Ver Relatórios
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vídeos Gerados</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Ativos</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCredits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>Todos os usuários cadastrados na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Período de Cadastro</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="15">Últimos 15 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Créditos</label>
                    <Select value={creditsFilter} onValueChange={setCreditsFilter}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os valores</SelectItem>
                        <SelectItem value="many">Muitos créditos (≥10)</SelectItem>
                        <SelectItem value="few">Poucos créditos (1-9)</SelectItem>
                        <SelectItem value="none">Sem créditos (0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Resultados</label>
                    <div className="rounded-md border border-border bg-muted/50 px-4 py-2.5">
                      <div className="text-sm text-muted-foreground">Exibindo</div>
                      <div className="text-xl font-bold">{filteredUsers.length} usuários</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Créditos</TableHead>
                        <TableHead className="font-semibold">Criado em</TableHead>
                        <TableHead className="font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum usuário encontrado com os filtros aplicados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.full_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.credits}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <AdminCreditsManager
                                  userId={user.id}
                                  userEmail={user.email}
                                  userName={user.full_name}
                                  currentCredits={user.credits}
                                  onSuccess={loadUsers}
                                />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o usuário <strong>{user.email}</strong>? 
                                        Esta ação não pode ser desfeita e irá remover todos os dados associados.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Vídeos Gerados</CardTitle>
                <CardDescription>Todos os vídeos gerados na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Período de Criação</label>
                    <Select value={videoDateFilter} onValueChange={setVideoDateFilter}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="15">Últimos 15 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Voz</label>
                    <Select value={voiceFilter} onValueChange={setVoiceFilter}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as vozes</SelectItem>
                        <SelectItem value="alloy">Alloy</SelectItem>
                        <SelectItem value="echo">Echo</SelectItem>
                        <SelectItem value="fable">Fable</SelectItem>
                        <SelectItem value="onyx">Onyx</SelectItem>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="shimmer">Shimmer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Resultados</label>
                    <div className="rounded-md border border-border bg-muted/50 px-4 py-2.5">
                      <div className="text-sm text-muted-foreground">Exibindo</div>
                      <div className="text-xl font-bold">{filteredVideos.length} vídeos</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Usuário</TableHead>
                        <TableHead className="font-semibold">Texto</TableHead>
                        <TableHead className="font-semibold">Voz</TableHead>
                        <TableHead className="font-semibold">Criado em</TableHead>
                        <TableHead className="font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVideos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum vídeo encontrado com os filtros aplicados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVideos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>{video.profiles?.email}</TableCell>
                            <TableCell className="max-w-xs truncate">{video.text}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{video.voice_id}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(video.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir vídeo?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteVideo(video.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transações</CardTitle>
                <CardDescription>Histórico de todas as transações de créditos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Período</label>
                    <Select value={transactionDateFilter} onValueChange={setTransactionDateFilter}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="15">Últimos 15 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                    <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="purchase">Compra</SelectItem>
                        <SelectItem value="usage">Usado</SelectItem>
                        <SelectItem value="bonus">Bônus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Resultados</label>
                    <div className="rounded-md border border-border bg-muted/50 px-4 py-2.5">
                      <div className="text-sm text-muted-foreground">Exibindo</div>
                      <div className="text-xl font-bold">{filteredTransactions.length} transações</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Usuário</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Descrição</TableHead>
                        <TableHead className="font-semibold">Valor</TableHead>
                        <TableHead className="font-semibold">Data/Hora</TableHead>
                        <TableHead className="font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada com os filtros aplicados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id} className={
                            transaction.type === 'purchase' && (transaction as any).status === 'paid'
                              ? 'bg-green-500/5'
                              : ''
                          }>
                            <TableCell>
                              {transaction.type === 'purchase' && (transaction as any).status === 'paid' ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                  <span className="text-xs font-medium text-green-500">
                                    PAGO
                                  </span>
                                </div>
                              ) : transaction.type === 'purchase' && (transaction as any).status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                  <span className="text-xs font-medium text-yellow-500">
                                    PENDENTE
                                  </span>
                                </div>
                              ) : transaction.type === 'usage' ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                                  <span className="text-xs font-medium text-orange-500">
                                    USADO
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                                  <span className="text-xs font-medium text-blue-500">
                                    BÔNUS
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{transaction.profiles?.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  transaction.type === 'purchase' ? 'default' :
                                  transaction.type === 'usage' ? 'secondary' :
                                  'outline'
                                }
                                className={
                                  transaction.type === 'purchase' && (transaction as any).status === 'paid'
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                    : ''
                                }
                              >
                                {transaction.type === 'purchase' ? 'Compra' : 
                                 transaction.type === 'usage' ? 'Usado' : 
                                 transaction.type === 'bonus' ? 'Bônus' : 
                                 transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {transaction.description}
                            </TableCell>
                            <TableCell className={
                              transaction.type === 'purchase' && (transaction as any).status === 'paid'
                                ? 'font-bold text-green-500'
                                : ''
                            }>
                              <span className={`${
                                transaction.amount > 0 
                                  ? 'text-green-500' 
                                  : 'text-red-500'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="text-xs">
                                  {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTransaction(transaction.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <LogoManager />
              <ThemeColorsManager />
              <PaymentSettingsManager />
              <VoicesManager />
              <HomePageCMS />
              <AppSettingsManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}
