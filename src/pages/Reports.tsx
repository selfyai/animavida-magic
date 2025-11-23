import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { HeaderWithCredits } from '@/components/HeaderWithCredits';
import MobileNav from '@/components/MobileNav';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Download, TrendingUp, DollarSign, CreditCard, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  payment_provider: string | null;
  payment_method: string | null;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

interface Stats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  totalUsers: number;
}

export default function Reports() {
  const { user, loading, isAdmin, checkingAdmin } = useAuth();
  const navigate = useNavigate();
  const [dataLoading, setDataLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    totalUsers: 0,
  });

  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (user === undefined) return;

    if (user === null) {
      navigate('/auth');
    } else if (!isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadTransactions();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [transactions, providerFilter, methodFilter, typeFilter, dateRange]);

  const loadTransactions = async () => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by provider
    if (providerFilter !== 'all') {
      filtered = filtered.filter(t => t.payment_provider === providerFilter);
    }

    // Filter by method
    if (methodFilter !== 'all') {
      filtered = filtered.filter(t => t.payment_method === methodFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Filter by date range
    if (dateRange?.from) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.created_at);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return transactionDate >= fromDate && transactionDate <= toDate;
        }
        
        return transactionDate >= fromDate;
      });
    }

    setFilteredTransactions(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (data: Transaction[]) => {
    const purchaseTransactions = data.filter(t => t.type === 'purchase' && t.amount > 0);
    const totalRevenue = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const uniqueUsers = new Set(data.map(t => t.user_id)).size;

    setStats({
      totalRevenue,
      totalTransactions: data.length,
      averageTransaction: purchaseTransactions.length > 0 ? totalRevenue / purchaseTransactions.length : 0,
      totalUsers: uniqueUsers,
    });
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Usuário', 'Email', 'Tipo', 'Valor', 'Provedor', 'Método', 'Descrição'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      t.profiles?.full_name || 'N/A',
      t.profiles?.email || 'N/A',
      t.type,
      t.amount.toString(),
      t.payment_provider || 'N/A',
      t.payment_method || 'N/A',
      t.description || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-transacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setProviderFilter('all');
    setMethodFilter('all');
    setTypeFilter('all');
    setDateRange(undefined);
  };

  // Enquanto está verificando admin ou carregando usuário
  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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

  const uniqueProviders = Array.from(new Set(transactions.map(t => t.payment_provider).filter(Boolean)));
  const uniqueMethods = Array.from(new Set(transactions.map(t => t.payment_method).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <HeaderWithCredits />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Relatórios de Transações</h1>
              <p className="text-muted-foreground">Análise detalhada de todas as transações</p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue} créditos</div>
              <p className="text-xs text-muted-foreground">R$ {stats.totalRevenue}.00</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Todas as operações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageTransaction.toFixed(0)} créditos</div>
              <p className="text-xs text-muted-foreground">Por compra</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Com transações</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre as transações por provedor, método e período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provedor</label>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os provedores</SelectItem>
                    {uniqueProviders.map(provider => (
                      <SelectItem key={provider} value={provider!}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Método</label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os métodos</SelectItem>
                    {uniqueMethods.map(method => (
                      <SelectItem key={method} value={method!}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                    <SelectItem value="usage">Uso</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Selecione o período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={clearFilters} variant="ghost">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações ({filteredTransactions.length})</CardTitle>
            <CardDescription>Lista detalhada de todas as transações filtradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada com os filtros selecionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{transaction.profiles?.full_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{transaction.profiles?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            transaction.type === 'purchase' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            transaction.type === 'bonus' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                            transaction.type === 'usage' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            transaction.type === 'admin' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          )}>
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.payment_provider || '-'}
                        </TableCell>
                        <TableCell>
                          {transaction.payment_method || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <MobileNav />
    </div>
  );
}
