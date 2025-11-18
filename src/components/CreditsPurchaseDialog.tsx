import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreditsPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete?: () => void;
}

const creditPackages = [
  { credits: 5, price: 5, popular: false },
  { credits: 10, price: 10, popular: true },
  { credits: 25, price: 25, popular: false },
  { credits: 50, price: 50, popular: false },
];

export function CreditsPurchaseDialog({ open, onOpenChange, onPurchaseComplete }: CreditsPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1]);
  const [customCredits, setCustomCredits] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      // Aqui você integraria com Stripe ou outro gateway de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Compra realizada!',
        description: `${selectedPackage.credits} créditos adicionados à sua conta.`,
      });
      
      onPurchaseComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro na compra',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Adicionar Créditos
          </DialogTitle>
          <DialogDescription>
            R$ 1,00 = 1 crédito para gerar vídeos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {creditPackages.map((pkg) => (
              <button
                key={pkg.credits}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedPackage.credits === pkg.credits
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold">{pkg.credits}</div>
                  <div className="text-xs text-muted-foreground">créditos</div>
                  <div className="mt-2 text-sm font-semibold">R$ {pkg.price}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou valor personalizado
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-credits">Quantidade de créditos</Label>
            <Input
              id="custom-credits"
              type="number"
              min="1"
              placeholder="Digite a quantidade"
              value={customCredits}
              onChange={(e) => {
                setCustomCredits(e.target.value);
                if (e.target.value) {
                  setSelectedPackage({
                    credits: parseInt(e.target.value),
                    price: parseInt(e.target.value),
                    popular: false,
                  });
                }
              }}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Créditos:</span>
              <span className="font-semibold">{selectedPackage.credits}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-lg">R$ {selectedPackage.price.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            onClick={handlePurchase} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? 'Processando...' : `Comprar ${selectedPackage.credits} Créditos`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
