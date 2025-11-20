import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface CreditsPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete?: () => void;
}
const creditPackages = [{
  credits: 5,
  price: 5,
  popular: false
}, {
  credits: 10,
  price: 10,
  popular: true
}, {
  credits: 25,
  price: 25,
  popular: false
}, {
  credits: 50,
  price: 50,
  popular: false
}];
export function CreditsPurchaseDialog({
  open,
  onOpenChange,
  onPurchaseComplete
}: CreditsPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1]);
  const [customCredits, setCustomCredits] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const {
    toast
  } = useToast();

  const formatBRL = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  const handlePurchase = async () => {
    setLoading(true);
    try {
      const {
        data: functionData,
        error: functionError
      } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          credits: selectedPackage.credits
        }
      });
      if (functionError) throw functionError;
      setPaymentData(functionData);
      toast({
        title: 'QR Code PIX gerado!',
        description: 'Escaneie o QR Code ou copie o código PIX para pagar.'
      });

      // Iniciar verificação automática do pagamento
      startPaymentCheck(functionData.id);
    } catch (error: any) {
      console.error('Erro ao gerar pagamento:', error);
      toast({
        title: 'Erro ao gerar pagamento',
        description: error.message || 'Não foi possível gerar o QR Code PIX. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const startPaymentCheck = async (paymentId: string) => {
    setCheckingPayment(true);
    const maxAttempts = 60; // 5 minutos (5 segundos * 60)
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;
        const {
          data: checkData,
          error: checkError
        } = await supabase.functions.invoke('check-pix-payment', {
          body: {
            paymentId,
            userId: user.id,
            credits: selectedPackage.credits
          }
        });
        if (checkError) {
          console.error('Erro ao verificar pagamento:', checkError);
          return;
        }
        if (checkData.status === 'PAID') {
          clearInterval(checkInterval);
          setCheckingPayment(false);
          toast({
            title: 'Pagamento confirmado!',
            description: `${selectedPackage.credits} créditos adicionados à sua conta.`
          });
          onPurchaseComplete?.();

          // Resetar e fechar após 2 segundos
          setTimeout(() => {
            setPaymentData(null);
            onOpenChange(false);
          }, 2000);
        } else if (checkData.status === 'EXPIRED' || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setCheckingPayment(false);
          toast({
            title: 'Pagamento expirado',
            description: 'O tempo para pagamento expirou. Gere um novo QR Code.',
            variant: 'destructive'
          });
          setPaymentData(null);
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      }
    }, 5000); // Verifica a cada 5 segundos
  };
  const copyPixCode = () => {
    if (paymentData?.brCode) {
      navigator.clipboard.writeText(paymentData.brCode);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Cole o código no seu app de pagamento.'
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const handleClose = () => {
    setPaymentData(null);
    setCheckingPayment(false);
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {paymentData ? 'Pagar com PIX' : 'Adicionar Créditos'}
          </DialogTitle>
          <DialogDescription>
            {paymentData ? 'Escaneie o QR Code ou copie o código PIX' : 'R$ 1,00 = 1 crédito para gerar vídeos'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!paymentData ? <>
              

              <div className="grid grid-cols-2 gap-3">
              {creditPackages.map(pkg => <button key={pkg.credits} onClick={() => setSelectedPackage(pkg)} className={`relative p-4 rounded-xl border-2 transition-all ${selectedPackage.credits === pkg.credits ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  {pkg.popular && <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <span className="flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        Popular
                      </span>
                    </div>}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{pkg.credits}</div>
                    <div className="text-xs text-muted-foreground">créditos</div>
                    <div className="mt-2 text-sm font-semibold">R$ {pkg.price}</div>
                  </div>
                </button>)}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-credits">Valor personalizado</Label>
              <Input
                id="custom-credits"
                type="text"
                placeholder="R$ 0,00"
                value={displayValue}
                onChange={(e) => {
                  const value = e.target.value;
                  const numbers = value.replace(/\D/g, '');
                  
                  if (numbers) {
                    const amount = parseFloat(numbers) / 100;
                    setDisplayValue(formatBRL(value));
                    setCustomCredits(amount.toString());
                    setSelectedPackage({
                      credits: Math.floor(amount),
                      price: amount,
                      popular: false
                    });
                  } else {
                    setDisplayValue('');
                    setCustomCredits('');
                  }
                }}
              />
            </div>

            <div className="rounded-xl bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Créditos:</span>
                <span className="font-semibold">{selectedPackage.credits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-lg">R$ {selectedPackage.price.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handlePurchase} className="w-full" size="lg" disabled={loading}>
              {loading ? 'Gerando QR Code...' : 'Gerar PIX'}
            </Button>
          </> : <>
            {checkingPayment && <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <div className="text-sm">
                  <div className="font-medium">Aguardando pagamento...</div>
                  <div className="text-muted-foreground">Verificando automaticamente</div>
                </div>
              </div>}

            <div className="flex justify-center">
              <img src={paymentData.brCodeBase64} alt="QR Code PIX" className="w-64 h-64 rounded-xl border-2 border-border" />
            </div>

            <div className="space-y-2">
              <Label>Código PIX (Copiar e Colar)</Label>
              <div className="flex gap-2">
                <Input value={paymentData.brCode} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyPixCode}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-semibold">R$ {(paymentData.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Créditos:</span>
                <span className="font-semibold">{selectedPackage.credits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expira em:</span>
                <span className="font-semibold">
                  {new Date(paymentData.expiresAt).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancelar
            </Button>
          </>}
        </div>
      </DialogContent>
    </Dialog>;
}