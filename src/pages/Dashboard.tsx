import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CreditsPurchaseDialog } from '@/components/CreditsPurchaseDialog';
import MobileNav from '@/components/MobileNav';
import { Coins, Video, LogOut, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showCreditDialog, setShowCreditDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadVideos();
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

  const loadVideos = async () => {
    const { data } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setVideos(data || []);
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Video AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowCreditDialog(true)}
            >
              <Coins className="h-4 w-4" />
              {profile?.credits || 0} créditos
            </Button>
            
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
            
            <Avatar className="cursor-pointer" onClick={signOut}>
              <AvatarFallback>
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="videos">Meus Vídeos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Novo Vídeo</CardTitle>
                <CardDescription>
                  Você tem {profile?.credits || 0} créditos disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Use o botão da câmera na página inicial para criar vídeos
                </p>
                <Button onClick={() => navigate('/')} className="w-full">
                  Ir para Criação de Vídeos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vídeos Recentes</CardTitle>
                <CardDescription>Seus últimos vídeos gerados</CardDescription>
              </CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum vídeo gerado ainda. Comece criando seu primeiro vídeo!
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => (
                      <Card key={video.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          <video
                            src={video.video_url}
                            controls
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none">
                            <span className="text-white text-[10px] font-medium">Feito com Alicia</span>
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <p className="text-sm line-clamp-2">{video.text}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {new Date(video.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="secondary">{video.voice_id}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Créditos disponíveis</label>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Coins className="h-6 w-6 text-primary" />
                    {profile?.credits || 0}
                  </p>
                </div>
                <Button onClick={() => setShowCreditDialog(true)}>
                  Adicionar Créditos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhuma transação ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge
                          variant={transaction.amount > 0 ? 'default' : 'secondary'}
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />

      <CreditsPurchaseDialog
        open={showCreditDialog}
        onOpenChange={setShowCreditDialog}
        onPurchaseComplete={() => {
          loadProfile();
          loadTransactions();
        }}
      />
    </div>
  );
}
