import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/MobileNav";
import { HeaderWithCredits } from "@/components/HeaderWithCredits";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

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
  
  // Pets (expandido)
  { text: "Meu cachorro aprovou! Você vai aprovar também", category: "Pets" },
  { text: "Gatinhos fofos merecem! Compre já", category: "Pets" },
  { text: "Seu pet vai te agradecer! Confia", category: "Pets" },
  { text: "Au au de aprovação garantido! Veja agora", category: "Pets" },
  
  // Imóveis (expandido)
  { text: "Aquele AP que sua sogra vai invejar! Veja agora", category: "Imóveis" },
  { text: "Vizinhos legais já inclusos! Provavelmente", category: "Imóveis" },
  { text: "Dá pra fazer home office lindo aqui! Confere", category: "Imóveis" },
  
  // Automotivo (expandido)
  { text: "Zero km novo? Não, sua autoestima! Compre agora", category: "Automotivo" },
  { text: "Carro que faz inveja no sinal! Test-drive", category: "Automotivo" },
  { text: "Roncador nato! Ouça esse motor", category: "Automotivo" },
  
  // Eventos (expandido)
  { text: "Festa tão boa que ninguém vai querer ir embora!", category: "Eventos" },
  { text: "Buffet aprovado por todos! Até pelo chato", category: "Eventos" },
  { text: "DJ que sabe o que faz! Pista vai ferver", category: "Eventos" },
  
  // Marketing Digital (expandido)
  { text: "Seus concorrentes já estão aqui! E você?", category: "Marketing" },
  { text: "Engajamento nas alturas! Literalmente", category: "Marketing" },
  { text: "Stories que param scroll! Mete bronca", category: "Marketing" },
  
  // Frases Engraçadas e Descontraídas
  { text: "Prometo que não é golpe! Confira agora", category: "Humor" },
  { text: "Tá esperando o que? Confere já!", category: "Humor" },
  { text: "Melhor que pão de queijo! Acredite", category: "Humor" },
  { text: "Sua mãe ia adorar isso! Sério mesmo", category: "Humor" },
  { text: "Arrasta pra cima... ops, clica aqui!", category: "Humor" },
  { text: "Tô rindo até agora! Você também vai", category: "Humor" },
  { text: "É bom demais até pra ser verdade! Mas é", category: "Humor" },
  { text: "Pode printar e mostrar pros amigos! Clica já", category: "Humor" },
  { text: "Isso é brabo demais! Vem conferir", category: "Humor" },
  { text: "Sério, você VAI querer! Confia", category: "Humor" },
  { text: "Até minha vó quer! E olha que ela é exigente", category: "Humor" },
  { text: "Isso sim que é conteúdo de qualidade! Veja", category: "Humor" },
  { text: "Dá RT... quero dizer, compartilha isso!", category: "Humor" },
  { text: "Corre que tá acabando! Mentira, mas corre mesmo", category: "Humor" },
  { text: "Top demais esse bagulho! Olha só", category: "Humor" },
  { text: "Perdi tudo no Tigrinho, mas isso aqui é TOP!", category: "Humor" },
  { text: "Nem acredito que é de graça! Pera, não é", category: "Humor" },
  { text: "Melhor impossível! Já testei tudo", category: "Humor" },
  { text: "Isso aqui é outro nível! Confia no pai", category: "Humor" },
  { text: "Tão bom que dá vontade de chorar! Sério", category: "Humor" },
  
  // Motivacionais Descontraídos
  { text: "Bora ser feliz? Clica aqui!", category: "Motivação" },
  { text: "A vida é curta demais! Aproveita agora", category: "Motivação" },
  { text: "Porque você merece! E ponto final", category: "Motivação" },
  { text: "Vai por mim, você precisa disso! Confia", category: "Motivação" },
  { text: "Segunda-feira não te derruba! Isso aqui levanta", category: "Motivação" },
  { text: "Aquele empurrãozinho que faltava! Vem", category: "Motivação" },
  { text: "Você no modo ON! Ativa agora", category: "Motivação" },
  { text: "É hoje que a mágica acontece! Acredita", category: "Motivação" },
  { text: "Chega de desculpas! Hora de agir", category: "Motivação" },
  { text: "Você consegue sim! Começa agora", category: "Motivação" },
  { text: "Bora fazer acontecer! Partiu?", category: "Motivação" },
  { text: "Energia boa só! Vem com tudo", category: "Motivação" },
  
  // Curiosidades
  { text: "Você sabia? Agora vai saber! Descubra aqui", category: "Curiosidade" },
  { text: "Plot twist incrível! Não perde", category: "Curiosidade" },
  { text: "Isso vai mudar sua vida! De verdade mesmo", category: "Curiosidade" },
  { text: "O segredo que ninguém te conta! Até agora", category: "Curiosidade" },
  { text: "A verdade que você precisa saber! Vem ver", category: "Curiosidade" },
  { text: "Isso vai explodir sua mente! Preparado?", category: "Curiosidade" },
  { text: "Ninguém te contou isso ainda! Mas eu vou", category: "Curiosidade" },
  { text: "Revelação bombástica! Fica até o fim", category: "Curiosidade" },
  
  // Call to Action Diretos
  { text: "Clica logo! O que tá esperando?", category: "CTA" },
  { text: "Bora! Não perde tempo", category: "CTA" },
  { text: "É agora ou nunca! Decide aí", category: "CTA" },
  { text: "Partiu? Vem comigo!", category: "CTA" },
  { text: "Toca aqui! Vai ser rápido", category: "CTA" },
  { text: "Fecha negócio? Clica já!", category: "CTA" },
  { text: "Não fica de fora! Entra logo", category: "CTA" },
  { text: "Vem que vem! Aproveita agora", category: "CTA" },
  { text: "Só clicar! Simples assim", category: "CTA" },
  { text: "Bora fechar? Aperta aí!", category: "CTA" },
  { text: "Se liga! Não deixa passar", category: "CTA" },
  { text: "Cola aqui! Vem rápido", category: "CTA" },
  
  // Entretenimento
  { text: "Diversão garantida sempre! Reserve agora", category: "Entretenimento" },
  { text: "Risadas sem parar! Garanta ingresso", category: "Entretenimento" },
  { text: "Show imperdível chegando! Compre já", category: "Entretenimento" },
  { text: "Experiência única inesquecível! Participe hoje", category: "Entretenimento" },
  { text: "Melhor programa possível! Confira aqui", category: "Entretenimento" },
  { text: "Netflix vai ter inveja! Assiste agora", category: "Entretenimento" },
  { text: "Tão bom que você esquece o celular! Vem", category: "Entretenimento" },
  
  // Delivery & Comida
  { text: "Fome de quê? A gente mata! Peça agora", category: "Delivery" },
  { text: "Quentinho na sua porta! Faz pedido", category: "Delivery" },
  { text: "Melhor que comida da vó! Quase", category: "Delivery" },
  { text: "Tô com água na boca! Você vai ficar também", category: "Delivery" },
  { text: "Delivery mais rápido impossível! Testa aí", category: "Delivery" },
  { text: "Hambúrguer dos sonhos! Literalmente", category: "Delivery" },
  
  // Sorteios & Promoções
  { text: "Corre que é promoção! Aproveita já", category: "Promoção" },
  { text: "Desconto que faz chorar! De felicidade", category: "Promoção" },
  { text: "Última chance! Não perde essa", category: "Promoção" },
  { text: "Preço de amigo! Melhor amigo", category: "Promoção" },
  { text: "Tá barato demais! Aproveita agora", category: "Promoção" },
  { text: "Promoção relâmpago! Corre aqui", category: "Promoção" },
  { text: "Só hoje esse preço! Corre", category: "Promoção" },
  
  // Sustentabilidade
  { text: "Salve o planeta! Compre sustentável", category: "Sustentabilidade" },
  { text: "Eco-friendly e estiloso! Conheça agora", category: "Sustentabilidade" },
  { text: "Consciência verde aqui! Faça parte", category: "Sustentabilidade" },
  { text: "Natureza agradece! Você também", category: "Sustentabilidade" },
  { text: "Futuro melhor começa aqui! Participe", category: "Sustentabilidade" },
];

const Ideas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory ? template.category === selectedCategory : true;
    const matchesSearch = searchTerm 
      ? template.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-safe-mobile pt-safe">
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

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Categorias</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>👉</span> Deslize para ver mais
            </p>
          </div>
          
          <div className="space-y-2 mb-6">
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                <CarouselItem className="pl-2 basis-auto">
                  <Badge
                    variant={selectedCategory === null ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todos
                  </Badge>
                </CarouselItem>
                {categories.slice(0, Math.ceil(categories.length / 2)).map((category) => (
                  <CarouselItem key={category} className="pl-2 basis-auto">
                    <Badge
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {categories.slice(Math.ceil(categories.length / 2)).map((category) => (
                  <CarouselItem key={category} className="pl-2 basis-auto">
                    <Badge
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar ideias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 backdrop-blur-sm"
          />
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo {startIndex + 1}-{Math.min(endIndex, filteredTemplates.length)} de {filteredTemplates.length} ideias
        </div>

        <div className="space-y-3">
          {paginatedTemplates.map((template, index) => (
            <Card
              key={startIndex + index}
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
                    onClick={() => handleCopy(template.text, startIndex + index)}
                    className="shrink-0"
                  >
                    {copiedIndex === (startIndex + index) ? (
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

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                </PaginationItem>
                
                <PaginationItem>
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </div>
                </PaginationItem>

                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <PushNotificationPrompt userId={user?.id} />

      <MobileNav />
    </div>
  );
};

export default Ideas;
