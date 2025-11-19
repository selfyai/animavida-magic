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
import { Users, Video, Coins, TrendingUp, Filter } from 'lucide-react';
import { AdminCreditsManager } from '@/components/AdminCreditsManager';

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
  const [transactions, setTransactions] = useState<any[]>([]);

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

  const loadVideos = async () => {
    const { data } = await supabase
      .from('generated_videos')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setVideos(data || []);
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('credit_transactions')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setTransactions(data || []);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-0">
      <HeaderWithCredits />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários, vídeos e transações da plataforma</p>
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
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>Todos os usuários cadastrados na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Filter className="h-4 w-4" />
                      Período de Cadastro
                    </div>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
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

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Coins className="h-4 w-4" />
                      Créditos
                    </div>
                    <Select value={creditsFilter} onValueChange={setCreditsFilter}>
                      <SelectTrigger>
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

                  <div className="flex-1 space-y-2">
                    <div className="text-sm font-medium opacity-0">.</div>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-sm text-muted-foreground">Exibindo</div>
                      <div className="text-2xl font-bold">{filteredUsers.length}</div>
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
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
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <AdminCreditsManager
                              userId={user.id}
                              userEmail={user.email}
                              userName={user.full_name}
                              currentCredits={user.credits}
                              onSuccess={loadUsers}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Texto</TableHead>
                      <TableHead>Voz</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell>{video.profiles?.email}</TableCell>
                        <TableCell className="max-w-xs truncate">{video.text}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{video.voice_id}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(video.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.profiles?.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === 'purchase' ? 'default' :
                              transaction.type === 'usage' ? 'secondary' :
                              'outline'
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}
