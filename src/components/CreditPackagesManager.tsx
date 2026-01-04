import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Coins, Save, Loader2 } from 'lucide-react';

interface CreditPackage {
  credits: number;
  price: number;
  popular: boolean;
}

const defaultPackages: CreditPackage[] = [
  { credits: 5, price: 5, popular: false },
  { credits: 10, price: 10, popular: true },
  { credits: 25, price: 25, popular: false },
  { credits: 50, price: 50, popular: false },
];

export function CreditPackagesManager() {
  const [packages, setPackages] = useState<CreditPackage[]>(defaultPackages);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'credit_packages')
        .maybeSingle();

      if (error) throw error;

      if (data && typeof data.value === 'object' && data.value !== null) {
        const value = data.value as unknown as { packages: CreditPackage[] };
        if (value.packages && Array.isArray(value.packages)) {
          setPackages(value.packages);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageChange = (index: number, field: 'credits' | 'price', value: number) => {
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPackages(newPackages);
  };

  const handlePopularChange = (index: string) => {
    const newPackages = packages.map((pkg, i) => ({
      ...pkg,
      popular: i === parseInt(index),
    }));
    setPackages(newPackages);
  };

  const validatePackages = (): boolean => {
    for (const pkg of packages) {
      if (pkg.credits < 1 || pkg.price < 1) {
        toast.error('Valores inválidos', {
          description: 'Créditos e preço devem ser maiores que 0',
        });
        return false;
      }
    }
    return true;
  };

  const savePackages = async () => {
    if (!validatePackages()) return;

    setSaving(true);
    try {
      // Use upsert to insert or update
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'credit_packages',
          value: { packages } as any,
          description: 'Configuração dos pacotes de créditos para compra',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      toast.success('Pacotes salvos com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar pacotes:', err);
      toast.error('Erro ao salvar', {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const popularIndex = packages.findIndex(p => p.popular);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Pacotes de Créditos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Pacotes de Créditos
        </CardTitle>
        <CardDescription>
          Configure os pacotes de créditos disponíveis para compra pelos usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={popularIndex.toString()}
          onValueChange={handlePopularChange}
          className="space-y-4"
        >
          {packages.map((pkg, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value={index.toString()} id={`popular-${index}`} />
                <Label htmlFor={`popular-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                  Popular
                </Label>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`credits-${index}`} className="text-xs">
                    Créditos
                  </Label>
                  <Input
                    id={`credits-${index}`}
                    type="number"
                    min={1}
                    value={pkg.credits}
                    onChange={(e) => handlePackageChange(index, 'credits', parseInt(e.target.value) || 1)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`price-${index}`} className="text-xs">
                    Preço (R$)
                  </Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    min={1}
                    step={0.01}
                    value={pkg.price}
                    onChange={(e) => handlePackageChange(index, 'price', parseFloat(e.target.value) || 1)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>

        <Button onClick={savePackages} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Pacotes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
