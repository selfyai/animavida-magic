import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/MobileNav";
import { HeaderWithCredits } from "@/components/HeaderWithCredits";
import { useAuth } from "@/hooks/useAuth";

interface IdeaTemplate {
  text: string;
  category: string;
}

const templates: IdeaTemplate[] = [
  // Moda & Estilo
  { text: "Vista sua melhor versão! Compre agora", category: "Moda" },
  { text: "Estilo único para você! Confira já", category: "Moda" },
  { text: "Looks incríveis esperando! Veja aqui", category: "Moda" },
  { text: "Transforme seu estilo! Aproveite hoje", category: "Moda" },
  { text: "Tendências que vestem você! Garanta já", category: "Moda" },
  
  // Alimentação
  { text: "Receitas deliciosas esperando! Prove agora", category: "Alimentação" },
  { text: "Comida caseira autêntica! Peça já", category: "Alimentação" },
  { text: "Sabor em cada prato! Experimente hoje", category: "Alimentação" },
  { text: "Ingredientes frescos sempre! Encomende agora", category: "Alimentação" },
  { text: "Refeições saudáveis e saborosas! Conheça já", category: "Alimentação" },
  
  // Fitness
  { text: "Transforme seu corpo! Comece hoje", category: "Fitness" },
  { text: "Conquiste seu shape! Treine agora", category: "Fitness" },
  { text: "Resultados reais comprovados! Inscreva-se já", category: "Fitness" },
  { text: "Alcance seus objetivos! Agende agora", category: "Fitness" },
  { text: "Corpo dos sonhos! Participe hoje", category: "Fitness" },
  
  // Beleza
  { text: "Beleza natural radiante! Agende agora", category: "Beleza" },
  { text: "Tratamentos exclusivos esperando! Experimente já", category: "Beleza" },
  { text: "Rotina perfeita para você! Comece hoje", category: "Beleza" },
  { text: "Realce sua beleza! Marque agora", category: "Beleza" },
  { text: "Cuidados profissionais aqui! Conheça já", category: "Beleza" },
  
  // Negócios & Empreendedorismo
  { text: "Escale seu negócio! Fale conosco", category: "Negócios" },
  { text: "Estratégias para vendas! Solicite consultoria", category: "Negócios" },
  { text: "Transforme sua empresa! Conheça agora", category: "Negócios" },
  { text: "Multiplique seus resultados! Agende reunião", category: "Negócios" },
  { text: "Cresça exponencialmente aqui! Saiba como", category: "Negócios" },
  
  // Educação
  { text: "Aprenda com especialistas! Matricule-se agora", category: "Educação" },
  { text: "Conhecimento transformador aqui! Acesse já", category: "Educação" },
  { text: "Desenvolva habilidades novas! Inscreva-se hoje", category: "Educação" },
  { text: "Invista no futuro! Comece agora", category: "Educação" },
  { text: "Certificação reconhecida nacionalmente! Garanta vaga", category: "Educação" },
  
  // Viagens & Turismo
  { text: "Explore destinos incríveis! Reserve agora", category: "Viagens" },
  { text: "Aventuras inesquecíveis esperam! Compre já", category: "Viagens" },
  { text: "Roteiros perfeitos planejados! Consulte aqui", category: "Viagens" },
  { text: "Viaje com conforto! Garanta pacote", category: "Viagens" },
  { text: "Férias dos sonhos! Aproveite promoção", category: "Viagens" },
  
  // Tecnologia
  { text: "Inovação facilitando tudo! Adquira agora", category: "Tecnologia" },
  { text: "Tecnologia de ponta! Experimente já", category: "Tecnologia" },
  { text: "Soluções inteligentes eficientes! Solicite demonstração", category: "Tecnologia" },
  { text: "Conecte-se ao futuro! Saiba mais", category: "Tecnologia" },
  { text: "Automatize seu negócio! Teste grátis", category: "Tecnologia" },
  
  // Saúde & Bem-estar
  { text: "Cuide da saúde! Agende consulta", category: "Saúde" },
  { text: "Bem-estar transforma vidas! Comece hoje", category: "Saúde" },
  { text: "Qualidade de vida! Conheça programas", category: "Saúde" },
  { text: "Viva melhor agora! Participe aqui", category: "Saúde" },
  { text: "Tratamentos personalizados eficazes! Marque horário", category: "Saúde" },
  
  // Pets
  { text: "Amor pelo seu pet! Compre agora", category: "Pets" },
  { text: "Produtos especiais esperando! Confira já", category: "Pets" },
  { text: "Cuide bem dele! Veja opções", category: "Pets" },
  { text: "Tudo para pets! Aproveite oferta", category: "Pets" },
  { text: "Pet feliz garantido! Adquira hoje", category: "Pets" },
  
  // Imóveis
  { text: "Encontre seu lar! Agende visita", category: "Imóveis" },
  { text: "Imóveis perfeitos disponíveis! Conheça já", category: "Imóveis" },
  { text: "Realize o sonho! Simule financiamento", category: "Imóveis" },
  { text: "Localização privilegiada sempre! Fale conosco", category: "Imóveis" },
  { text: "Investimento seguro aqui! Saiba mais", category: "Imóveis" },
  
  // Serviços
  { text: "Profissionais qualificados aqui! Contrate agora", category: "Serviços" },
  { text: "Qualidade em serviços! Solicite orçamento", category: "Serviços" },
  { text: "Soluções práticas rápidas! Peça hoje", category: "Serviços" },
  { text: "Atendimento rápido sempre! Ligue agora", category: "Serviços" },
  { text: "Excelência em tudo! Agende serviço", category: "Serviços" },
  
  // Automóveis
  { text: "Carros dos sonhos! Agende test-drive", category: "Automóveis" },
  { text: "Dirigir nunca foi tão fácil! Financie hoje", category: "Automóveis" },
  { text: "Manutenção especializada garantida! Marque revisão", category: "Automóveis" },
  { text: "Peças originais sempre! Compre agora", category: "Automóveis" },
  { text: "Seu carro impecável! Agende lavagem", category: "Automóveis" },
  
  // Decoração
  { text: "Transforme ambientes agora! Veja projeto", category: "Decoração" },
  { text: "Estilo e conforto! Confira catálogo", category: "Decoração" },
  { text: "Casa dos sonhos! Agende consultoria", category: "Decoração" },
  { text: "Móveis sob medida! Solicite orçamento", category: "Decoração" },
  { text: "Decoração perfeita garantida! Inspire-se aqui", category: "Decoração" },
  
  // Música
  { text: "Aprenda música profissionalmente! Matricule-se agora", category: "Música" },
  { text: "Instrumentos de qualidade! Compre já", category: "Música" },
  { text: "Estúdio profissional disponível! Grave agora", category: "Música" },
  { text: "Aulas particulares personalizadas! Agende hoje", category: "Música" },
  { text: "Seu talento merece! Comece agora", category: "Música" },
  
  // Arte
  { text: "Expresse sua criatividade! Inscreva-se já", category: "Arte" },
  { text: "Obras únicas esperando! Adquira agora", category: "Arte" },
  { text: "Técnicas artísticas avançadas! Aprenda hoje", category: "Arte" },
  { text: "Materiais profissionais aqui! Compre já", category: "Arte" },
  { text: "Arte transforma tudo! Participe agora", category: "Arte" },
  
  // Fotografia
  { text: "Momentos eternizados perfeitamente! Contrate agora", category: "Fotografia" },
  { text: "Ensaio profissional incrível! Agende sessão", category: "Fotografia" },
  { text: "Equipamentos de qualidade! Alugue hoje", category: "Fotografia" },
  { text: "Aprenda fotografia profissional! Inscreva-se já", category: "Fotografia" },
  { text: "Registre memórias especiais! Garanta vaga", category: "Fotografia" },
  
  // Eventos
  { text: "Evento perfeito garantido! Solicite orçamento", category: "Eventos" },
  { text: "Celebrações inesquecíveis aqui! Agende reunião", category: "Eventos" },
  { text: "Buffet de qualidade! Prove agora", category: "Eventos" },
  { text: "Decoração impecável sempre! Conheça portfólio", category: "Eventos" },
  { text: "Seu evento merece! Fale conosco", category: "Eventos" },
  
  // Consultoria
  { text: "Especialistas ao seu lado! Agende consultoria", category: "Consultoria" },
  { text: "Soluções sob medida! Solicite diagnóstico", category: "Consultoria" },
  { text: "Otimize seus processos! Conheça metodologia", category: "Consultoria" },
  { text: "Resultados mensuráveis comprovados! Saiba como", category: "Consultoria" },
  { text: "Transforme seu negócio! Fale hoje", category: "Consultoria" },
  
  // E-commerce
  { text: "Loja online lucrativa! Monte agora", category: "E-commerce" },
  { text: "Venda mais online! Comece hoje", category: "E-commerce" },
  { text: "Plataforma completa disponível! Teste grátis", category: "E-commerce" },
  { text: "Integração total garantida! Saiba mais", category: "E-commerce" },
  { text: "Escale vendas digitalmente! Agende demonstração", category: "E-commerce" },
  
  // Marketing Digital
  { text: "Sua marca visível! Contrate agora", category: "Marketing" },
  { text: "Campanhas que convertem! Solicite proposta", category: "Marketing" },
  { text: "Leads qualificados diariamente! Comece hoje", category: "Marketing" },
  { text: "ROI comprovado sempre! Veja resultados", category: "Marketing" },
  { text: "Domine redes sociais! Fale conosco", category: "Marketing" },
  
  // Finanças
  { text: "Organize suas finanças! Agende consultoria", category: "Finanças" },
  { text: "Investimentos inteligentes sempre! Saiba mais", category: "Finanças" },
  { text: "Planejamento financeiro personalizado! Comece agora", category: "Finanças" },
  { text: "Economize com estratégia! Conheça método", category: "Finanças" },
  { text: "Liberdade financeira possível! Descubra como", category: "Finanças" },
  
  // Investimentos
  { text: "Rentabilidade acima mercado! Invista agora", category: "Investimentos" },
  { text: "Portfólio diversificado inteligente! Monte hoje", category: "Investimentos" },
  { text: "Assessoria especializada gratuita! Agende conversa", category: "Investimentos" },
  { text: "Seu dinheiro trabalhando! Comece agora", category: "Investimentos" },
  { text: "Patrimônio crescendo sempre! Saiba como", category: "Investimentos" },
  
  // Cripto
  { text: "Invista em cripto! Abra conta", category: "Cripto" },
  { text: "Bitcoin e altcoins! Compre agora", category: "Cripto" },
  { text: "Segurança em blockchain! Conheça plataforma", category: "Cripto" },
  { text: "Aprenda sobre cripto! Acesse curso", category: "Cripto" },
  { text: "Futuro do dinheiro! Entre agora", category: "Cripto" },
  
  // Coaching
  { text: "Alcance seu potencial! Agende sessão", category: "Coaching" },
  { text: "Transformação pessoal real! Comece hoje", category: "Coaching" },
  { text: "Objetivos claros definidos! Solicite diagnóstico", category: "Coaching" },
  { text: "Método comprovado internacionalmente! Conheça aqui", category: "Coaching" },
  { text: "Sua melhor versão! Fale conosco", category: "Coaching" },
  
  // Psicologia
  { text: "Saúde mental importa! Agende consulta", category: "Psicologia" },
  { text: "Terapia online disponível! Marque horário", category: "Psicologia" },
  { text: "Bem-estar emocional primeiro! Comece agora", category: "Psicologia" },
  { text: "Atendimento sigiloso sempre! Conheça profissionais", category: "Psicologia" },
  { text: "Cuide de você! Fale hoje", category: "Psicologia" },
  
  // Advocacia
  { text: "Direitos garantidos sempre! Consulte advogado", category: "Advocacia" },
  { text: "Expertise jurídica completa! Agende reunião", category: "Advocacia" },
  { text: "Defesa competente garantida! Fale conosco", category: "Advocacia" },
  { text: "Soluções jurídicas eficazes! Entre contato", category: "Advocacia" },
  { text: "Justiça ao alcance! Ligue agora", category: "Advocacia" },
  
  // Contabilidade
  { text: "Contabilidade descomplicada aqui! Contrate agora", category: "Contabilidade" },
  { text: "Impostos otimizados legalmente! Solicite análise", category: "Contabilidade" },
  { text: "Conformidade fiscal garantida! Agende reunião", category: "Contabilidade" },
  { text: "Relatórios precisos sempre! Conheça serviços", category: "Contabilidade" },
  { text: "Economize com planejamento! Fale hoje", category: "Contabilidade" },
];

const Ideas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-24">
      <HeaderWithCredits />
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ideias & Modelos</h1>
            <p className="text-sm text-muted-foreground">Frases prontas para seus vídeos</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="space-y-3">
          {filteredTemplates.map((template, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {template.category}
                    </Badge>
                    <p className="text-foreground leading-relaxed">{template.text}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(template.text, index)}
                    className="shrink-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Ideas;
