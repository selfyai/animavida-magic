import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Coins, Plus, Minus, User, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminCreditsManagerProps {
  userId: string;
  userEmail: string;
  userName?: string | null;
  currentCredits: number;
  onSuccess: () => void;
}

export function AdminCreditsManager({ userId, userEmail, userName, currentCredits, onSuccess }: AdminCreditsManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'credits' | 'profile' | 'payments'>('credits');
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [newEmail, setNewEmail] = useState(userEmail);
  const [newName, setNewName] = useState(userName || '');
  const [newPhone, setNewPhone] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [paidTransactions, setPaidTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const { toast } = useToast();

  // Carregar dados atuais ao abrir
  useEffect(() => {
    if (open) {
      loadUserData();
      loadPaidTransactions();
      
      // Configurar realtime para atualizar automaticamente quando transações são pagas
      const channel = supabase
        .channel('user-transactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'credit_transactions',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Transação atualizada:', payload);
            loadPaidTransactions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, userId]);

  const loadUserData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('cellphone, tax_id')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setNewPhone(data.cellphone || '');
      setNewTaxId(data.tax_id || '');
    }
  };

  const loadPaidTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .eq('type', 'purchase')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaidTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCreditsSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor válido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-credits', {
        body: {
          targetUserId: userId,
          amount: parseInt(amount),
          type,
          description: description || undefined,
        }
      });

      if (error) throw error;

      toast({
        title: 'Créditos atualizados!',
        description: `Novo saldo: ${data.newBalance} créditos`,
      });

      setAmount('');
      setDescription('');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao gerenciar créditos:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar os créditos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!newEmail) {
      toast({
        title: 'Email inválido',
        description: 'Digite um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: newEmail,
          full_name: newName || null,
          cellphone: newPhone || null,
          tax_id: newTaxId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado!',
        description: 'Os dados do usuário foram atualizados com sucesso.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Coins className="h-4 w-4 mr-2" />
          Gerenciar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Gerenciar Usuário
          </DialogTitle>
          <DialogDescription>
            Gerenciar créditos e perfil de {userEmail}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'credits' | 'profile' | 'payments')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credits">
              <Coins className="h-4 w-4 mr-2" />
              Créditos
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Receipt className="h-4 w-4 mr-2" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm text-muted-foreground">Saldo Atual</div>
            <div className="text-2xl font-bold">{currentCredits} créditos</div>
          </div>

          <div className="space-y-2">
            <Label>Ação</Label>
            <Select value={type} onValueChange={(value: 'add' | 'remove') => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Adicionar Créditos
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-500" />
                    Remover Créditos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="Digite a quantidade"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Motivo (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo da alteração..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {amount && parseInt(amount) > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-sm font-medium">
                {type === 'add' ? 'Novo saldo:' : 'Novo saldo:'}{' '}
                <span className={type === 'add' ? 'text-green-600' : 'text-red-600'}>
                  {type === 'add' 
                    ? currentCredits + parseInt(amount)
                    : Math.max(0, currentCredits - parseInt(amount))
                  } créditos
                </span>
              </div>
            </div>
          )}

            <Button 
              onClick={handleCreditsSubmit} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Processando...' : type === 'add' ? 'Adicionar Créditos' : 'Remover Créditos'}
            </Button>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm text-muted-foreground">Usuário ID</div>
              <div className="text-sm font-mono">{userId}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite o email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite o nome completo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Usado para pagamentos PIX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">CPF/CNPJ (opcional)</Label>
              <Input
                id="taxId"
                type="text"
                placeholder="123.456.789-01 ou 12.345.678/0001-90"
                value={newTaxId}
                onChange={(e) => setNewTaxId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Usado para pagamentos PIX
              </p>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-sm">
                <div className="font-medium mb-1">⚠️ Atenção</div>
                <div className="text-muted-foreground">
                  Alterar o email não afeta a autenticação. O usuário continuará fazendo login com o email original.
                </div>
              </div>
            </div>

            <Button 
              onClick={handleProfileSubmit} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar Perfil'}
            </Button>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm text-muted-foreground">Transações Pagas</div>
              <div className="text-2xl font-bold">{paidTransactions.length}</div>
            </div>

            {loadingTransactions ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando transações...
              </div>
            ) : paidTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação paga encontrada
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Data/Hora</TableHead>
                      <TableHead className="font-semibold">Créditos</TableHead>
                      <TableHead className="font-semibold">Método</TableHead>
                      <TableHead className="font-semibold">Provedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{new Date(transaction.created_at).toLocaleDateString('pt-BR')}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            +{transaction.amount}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {transaction.payment_method || '-'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {transaction.payment_provider || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
