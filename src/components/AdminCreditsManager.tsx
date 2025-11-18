import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminCreditsManagerProps {
  userId: string;
  userEmail: string;
  currentCredits: number;
  onSuccess: () => void;
}

export function AdminCreditsManager({ userId, userEmail, currentCredits, onSuccess }: AdminCreditsManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = async () => {
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

      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Coins className="h-4 w-4 mr-2" />
          Gerenciar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Gerenciar Créditos
          </DialogTitle>
          <DialogDescription>
            Adicionar ou remover créditos de {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            onClick={handleSubmit} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Processando...' : type === 'add' ? 'Adicionar Créditos' : 'Remover Créditos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
