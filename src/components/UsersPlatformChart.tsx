import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Smartphone } from 'lucide-react';

const COLORS = {
  android: '#3DDC84',
  ios: '#007AFF',
  web: '#9b87f5',
  unknown: '#6B7280'
};

export function UsersPlatformChart() {
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [pwaData, setPwaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('platform, pwa_installed, created_at');

      if (profiles) {
        // Count by platform
        const platformCounts: Record<string, number> = {
          android: 0,
          ios: 0,
          web: 0,
          unknown: 0,
        };

        profiles.forEach(profile => {
          const platform = profile.platform || 'unknown';
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });

        const platformChartData = Object.entries(platformCounts).map(([name, value]) => ({
          name: name === 'unknown' ? 'Desconhecido' : name === 'android' ? 'Android' : name === 'ios' ? 'iOS' : 'Web',
          value,
          users: value,
        }));

        setPlatformData(platformChartData);

        // PWA data
        const withPWA = profiles.filter(p => p.pwa_installed).length;
        const withoutPWA = profiles.length - withPWA;

        setPwaData([
          { name: 'Com PWA', value: withPWA },
          { name: 'Sem PWA', value: withoutPWA },
        ]);
      }
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Platform Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Distribuição por Plataforma
          </CardTitle>
          <CardDescription>
            Usuários organizados por sistema operacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar 
                dataKey="users" 
                name="Usuários"
                radius={[8, 8, 0, 0]}
              >
                {platformData.map((entry, index) => {
                  const colorKey = entry.name.toLowerCase() === 'android' ? 'android' 
                    : entry.name.toLowerCase() === 'ios' ? 'ios'
                    : entry.name.toLowerCase() === 'web' ? 'web'
                    : 'unknown';
                  return <Cell key={`cell-${index}`} fill={COLORS[colorKey as keyof typeof COLORS]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PWA Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status de Instalação PWA
          </CardTitle>
          <CardDescription>
            Usuários com aplicativo instalado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pwaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pwaData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Com PWA Instalado:</span>
              <span className="font-semibold">{pwaData[0]?.value || 0} usuários</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sem PWA Instalado:</span>
              <span className="font-semibold">{pwaData[1]?.value || 0} usuários</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}