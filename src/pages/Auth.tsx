import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Video, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [taxId, setTaxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check URL for mode parameter (login or signup)
  const searchParams = new URLSearchParams(window.location.search);
  const modeParam = searchParams.get('mode') || 'login';
  const initialTab = modeParam === 'login' ? 'signin' : 'signup';
  const [activeTab, setActiveTab] = useState(initialTab);

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateCPF(taxId)) {
        toast({
          title: 'CPF inválido',
          description: 'Por favor, insira um CPF válido.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Get user's IP address for rate limiting
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Check if IP is allowed to sign up
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-signup-limit', {
        body: { ip }
      });

      if (limitError || !limitCheck?.allowed) {
        toast({
          title: 'Limite excedido',
          description: 'Muitas tentativas de cadastro. Tente novamente em 24 horas.',
          variant: 'destructive',
        });
        await supabase.functions.invoke('log-signup', {
          body: { ip, success: false }
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            tax_id: taxId.replace(/[^\d]/g, '')
          }
        }
      });

      if (error) throw error;

      // Atualizar o perfil com o CPF
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ tax_id: taxId.replace(/[^\d]/g, '') })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Erro ao atualizar CPF:', profileError);
        }

        // Log successful signup
        await supabase.functions.invoke('log-signup', {
          body: { ip, success: true }
        });
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você ganhou 1 crédito grátis para começar.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <Card className="w-full">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Video className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Selfyai</CardTitle>
          <CardDescription>
            Crie vídeos incríveis com inteligência artificial
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
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <Input
                    id="signup-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={taxId}
                    onChange={(e) => setTaxId(formatCPF(e.target.value))}
                    required
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
                  🎁 Ganhe 1 crédito grátis ao criar sua conta!
                </div>
                <Button type="submit" className="w-full" disabled={loading || !termsAccepted}>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Aceito os{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsDialog(true)}
                      className="text-primary underline hover:text-primary/80"
                    >
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
    </div>
  );
}
