import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/hooks/useAppSettings';
import { ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import logo from '@/assets/logo.png';
export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    logoUrl
  } = useAppSettings();

  // Check URL for mode parameter (login or signup)
  const searchParams = new URLSearchParams(window.location.search);
  const modeParam = searchParams.get('mode') || 'login';
  const initialTab = modeParam === 'login' ? 'signin' : 'signup';
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      // Só redireciona se tiver uma sessão válida e não expirada
      if (session && session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
        window.scrollTo(0, 0);
        navigate('/');
      }
    });
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Check if IP is allowed to sign up (IP will be detected server-side)
      const {
        data: limitCheck,
        error: limitError
      } = await supabase.functions.invoke('check-signup-limit');
      if (limitError || !limitCheck?.allowed) {
        toast({
          title: 'Limite excedido',
          description: 'Muitas tentativas de cadastro. Tente novamente em 24 horas.',
          variant: 'destructive'
        });
        await supabase.functions.invoke('log-signup', {
          body: {
            success: false
          }
        });
        setLoading(false);
        return;
      }
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;

      // Log successful signup
      if (data.user) {
        await supabase.functions.invoke('log-signup', {
          body: {
            success: true
          }
        });
      }
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você ganhou 1 crédito grátis para começar.'
      });
      window.scrollTo(0, 0);
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta.'
      });
      window.scrollTo(0, 0);
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login com Google',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 pt-20 md:pt-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <Card className="w-full">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-2">
            <img src={logoUrl || logo} alt="Selfyai" className="h-10 w-auto" onError={e => {
              const target = e.target as HTMLImageElement;
              target.src = logo;
            }} />
          </div>
          
          <CardDescription>
            Crie vídeos curtos incríveis com inteligência artificial a partir de uma selfie                        
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-mail</Label>
                  <Input id="signin-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperação de Senha</DialogTitle>
                        <DialogDescription>
                          Para recuperar suas credenciais de login, envie um e-mail para{" "}
                          <a href="mailto:contato@selfyai.fun" className="text-primary hover:underline">
                            contato@selfyai.fun
                          </a>{" "}
                          com o assunto "Recuperação de Senha" e informando o e-mail cadastrado na plataforma.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Entrar com Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                </div>
                <div className="rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
                  🎁 Ganhe 1 crédito grátis ao criar sua conta!
                </div>
                <Button type="submit" className="w-full" disabled={loading || !termsAccepted}>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="terms" checked={termsAccepted} onCheckedChange={checked => setTermsAccepted(checked as boolean)} className="h-3.5 w-3.5" />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Aceito os{' '}
                    <button type="button" onClick={() => setShowTermsDialog(true)} className="text-primary underline hover:text-primary/80">
                      Termos de Uso
                    </button>
                  </label>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>

      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Termos de Uso - SelfyAI</DialogTitle>
            <DialogDescription>Última atualização: 18/11/2025</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <p>
                Bem-vindo ao SelfyAI! Estes Termos regulam o uso do nosso aplicativo e dos serviços de geração de vídeos a partir de imagens enviadas pelos usuários.
                Ao criar uma conta, acessar ou utilizar o app, você declara ter lido, compreendido e concordado com estes Termos de Uso.
              </p>

              <div>
                <h3 className="font-semibold mb-2">1. Sobre o SelfyAI</h3>
                <p className="text-muted-foreground">
                  O SelfyAI é uma plataforma que utiliza inteligência artificial para transformar imagens enviadas pelos usuários em vídeos animados.
                  O processamento pode incluir animações, movimentos, ajustes visuais e efeitos gerados automaticamente.
                </p>
                <p className="text-muted-foreground mt-2">
                  O serviço é disponibilizado "no estado em que se encontra", podendo apresentar variações de qualidade e resultados.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Elegibilidade</h3>
                <p className="text-muted-foreground">Para usar o app, você deve:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Ter 13 anos ou mais (ou idade mínima permitida no seu país);</li>
                  <li>Ser o proprietário da imagem enviada ou ter permissão para utilizá-la;</li>
                  <li>Cumprir todas as leis locais, nacionais e internacionais aplicáveis.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Se você tiver menos de 18 anos, deve usar o app com supervisão e consentimento de um responsável.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Conta e Acesso</h3>
                <p className="text-muted-foreground">Você é responsável por:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Manter a segurança da sua conta;</li>
                  <li>Não compartilhar senhas;</li>
                  <li>Todas as atividades realizadas por meio dela.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Podemos suspender ou encerrar o acesso caso haja uso indevido, violação de termos ou risco à segurança do sistema.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Conteúdo Enviado pelo Usuário</h3>
                <p className="text-muted-foreground">Ao enviar imagens, vídeos, textos ou qualquer conteúdo, você declara que:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Possui os direitos necessários sobre o material;</li>
                  <li>Obteve consentimento de terceiros que apareçam na imagem;</li>
                  <li>Não está violando direitos autorais, privacidade ou leis.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Você é integralmente responsável pelo conteúdo enviado e pelos resultados gerados.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. Licença para Processamento da Imagem</h3>
                <p className="text-muted-foreground">
                  Ao enviar uma imagem, você concede ao SelfyAI uma licença limitada, não exclusiva, revogável e temporária apenas para:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Processar seus arquivos com IA;</li>
                  <li>Armazená-los temporariamente para execução do serviço;</li>
                  <li>Entregar o resultado ao usuário.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Nós não revendemos, compartilhamos ou utilizamos suas imagens para treinar nossos modelos sem seu consentimento explícito.
                </p>
                <p className="text-muted-foreground mt-2">
                  Após o processamento, imagens podem ser removidas automaticamente conforme políticas internas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">6. Propriedade dos Resultados</h3>
                <p className="text-muted-foreground">O vídeo final gerado:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Pertence a você, desde que a imagem original seja sua;</li>
                  <li>Pode ser usado para fins pessoais ou comerciais, desde que respeite leis e direitos de terceiros.</li>
                </ul>
                <p className="text-muted-foreground mt-2">O SelfyAI mantém os direitos sobre:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>O software, modelos de IA, infraestrutura e algoritmos;</li>
                  <li>A interface, marca e design do app.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">7. Conteúdos Proibidos</h3>
                <p className="text-muted-foreground">É estritamente proibido enviar conteúdos que incluam:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Nudez explícita, pornografia ou conteúdo sexual de qualquer tipo envolvendo menores;</li>
                  <li>Violência extrema, crueldade ou incitação ao ódio;</li>
                  <li>Material ilegal, difamatório, discriminatório ou prejudicial;</li>
                  <li>Imagens de terceiros sem permissão;</li>
                  <li>Conteúdos protegidos por direitos autorais sem autorização;</li>
                  <li>Tentativas de gerar deepfakes enganosos destinados a prejudicar, enganar ou se passar por outra pessoa.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  O descumprimento pode resultar em suspensão permanente da conta.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">8. Riscos e Limitações</h3>
                <p className="text-muted-foreground">Você compreende que:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Os resultados podem conter erros, distorções ou interpretações inesperadas;</li>
                  <li>A qualidade depende da imagem fornecida;</li>
                  <li>O serviço pode sofrer interrupções, falhas ou instabilidades;</li>
                  <li>O SelfyAI não garante disponibilidade ininterrupta.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">9. Privacidade e Dados</h3>
                <p className="text-muted-foreground">O SelfyAI pode:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Armazenar imagens temporariamente;</li>
                  <li>Salvar vídeos gerados para facilitar downloads;</li>
                  <li>Registrar dados de uso para melhorias internas.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  O SelfyAI não coleta biometria sensível, não vende dados e segue práticas de segurança para proteger arquivos.
                </p>
                <p className="text-muted-foreground mt-2">
                  Uma Política de Privacidade separada detalhará como dados são coletados, usados e armazenados.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">10. Suspensão e Encerramento de Conta</h3>
                <p className="text-muted-foreground">Podemos suspender ou encerrar o acesso caso:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Você viole estes Termos;</li>
                  <li>Utilize o app para fins ilegais;</li>
                  <li>Prejudique o funcionamento do serviço;</li>
                  <li>Tente acessar áreas restritas ou manipular o sistema.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">11. Alterações nos Termos</h3>
                <p className="text-muted-foreground">
                  O SelfyAI pode atualizar estes Termos periodicamente.
                  Ao continuar usando o app após mudanças, você concorda com a versão mais recente.
                </p>
                <p className="text-muted-foreground mt-2">
                  Avisos importantes poderão ser exibidos dentro do app em caso de alterações significativas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">12. Limitação de Responsabilidade</h3>
                <p className="text-muted-foreground">O SelfyAI não se responsabiliza por:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Uso indevido das imagens ou vídeos gerados;</li>
                  <li>Danos causados por terceiros;</li>
                  <li>Perdas decorrentes de falhas de rede, servidor ou dispositivo;</li>
                  <li>Conteúdo enviado por usuários.</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  O uso do app é por sua conta e risco.
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>;
}