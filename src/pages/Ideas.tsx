import { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/MobileNav";

interface IdeaTemplate {
  text: string;
  category: string;
}

const templates: IdeaTemplate[] = [
  // Moda & Estilo
  { text: "Descubra sua melhor versão com nossas peças exclusivas! 👗✨ Confira todas as novidades no link da bio", category: "Moda" },
  { text: "Vista-se com muito estilo e atitude todos os dias! 🔥 Nossa coleção exclusiva está disponível agora mesmo", category: "Moda" },
  { text: "Looks incríveis e inspiradores estão te esperando aqui! Acesse o link na bio para comprar 🛍️", category: "Moda" },
  { text: "Transforme seu guarda-roupa com peças que valorizam seu estilo único! ✨ Visite nosso site pelo link da bio", category: "Moda" },
  
  // Alimentação
  { text: "Receitas deliciosas e práticas para todos os dias da semana! 🍰 Acesse nosso site completo no link da bio", category: "Alimentação" },
  { text: "Comida caseira que aquece o coração e alimenta a alma! ❤️ Faça seu pedido agora pelo link na bio", category: "Alimentação" },
  { text: "Sabor autêntico que você não encontra em nenhum outro lugar por aí! 🍕 Confira nosso cardápio no link da bio", category: "Alimentação" },
  { text: "Experimente pratos incríveis feitos com ingredientes frescos e selecionados todos os dias! 🍜 Link na bio", category: "Alimentação" },
  
  // Fitness
  { text: "Transforme seu corpo com nossos programas personalizados de treino completo! 💪 Acesse todos os detalhes no link da bio", category: "Fitness" },
  { text: "Conquiste seu melhor shape começando sua jornada fitness hoje mesmo! 🏋️ Clique no link da bio para começar", category: "Fitness" },
  { text: "Resultados reais e comprovados com treinos eficientes e planejados! Saiba mais no link da bio agora 🔥", category: "Fitness" },
  { text: "Alcance seus objetivos fitness com acompanhamento profissional especializado e dedicado! 💯 Link na bio", category: "Fitness" },
  
  // Beleza
  { text: "Beleza natural e pele radiante com nossos produtos especiais selecionados! ✨ Descubra tudo no link da bio", category: "Beleza" },
  { text: "Cuide de você com muito carinho usando nossos tratamentos exclusivos! 💅 Acesse nosso catálogo completo no link", category: "Beleza" },
  { text: "Sua rotina de skincare perfeita e ideal te espera aqui conosco! Confira nossas dicas no link da bio 🌸", category: "Beleza" },
  { text: "Realce sua beleza única com produtos de alta qualidade e eficácia comprovada! 💄 Link na bio", category: "Beleza" },
  
  // Negócios & Empreendedorismo
  { text: "Escale seu negócio digital alcançando novos patamares de sucesso hoje mesmo! 📈 Consultoria gratuita disponível no link da bio", category: "Negócios" },
  { text: "Estratégias comprovadas que realmente funcionam para alavancar suas vendas rapidamente! 💼 Conheça todos os nossos serviços especializados no link", category: "Negócios" },
  { text: "Transforme sua empresa com métodos inovadores de gestão e marketing digital! 🚀 Saiba muito mais no link da bio", category: "Negócios" },
  { text: "Aprenda a multiplicar seus resultados com técnicas profissionais de vendas online! 💰 Link na bio", category: "Negócios" },
  
  // Educação
  { text: "Aprenda com os melhores professores e especialistas da área de atuação! 📚 Todos os cursos disponíveis no link da bio", category: "Educação" },
  { text: "Conhecimento de qualidade que realmente transforma vidas e carreiras profissionais! 🎓 Acesse todos os nossos materiais gratuitos no link", category: "Educação" },
  { text: "Desenvolva novas habilidades profissionais que vão impulsionar sua carreira para outro nível! 💡 Confira os cursos no link da bio", category: "Educação" },
  { text: "Invista no seu futuro aprendendo com conteúdos de alta qualidade e aplicação prática! 🌟 Link na bio", category: "Educação" },
  
  // Viagens & Turismo
  { text: "Seu próximo destino dos sonhos está te esperando aqui com pacotes exclusivos! ✈️ Veja todos os roteiros no link da bio", category: "Viagens" },
  { text: "Viva experiências inesquecíveis e incríveis em lugares paradisíacos ao redor do mundo! 🌍 Confira as promoções no link", category: "Viagens" },
  { text: "Explore o mundo inteiro com a gente e crie memórias que vão durar para sempre! 🗺️ Pacotes especiais no link da bio", category: "Viagens" },
  { text: "Descubra destinos incríveis com preços que cabem no seu bolso e muita qualidade! 🏖️ Link na bio", category: "Viagens" },
  
  // Tecnologia & Inovação
  { text: "Inovação tecnológica de ponta que realmente facilita e melhora sua vida no dia a dia! 📱 Conheça todas as soluções no link da bio", category: "Tecnologia" },
  { text: "Tecnologia de última geração sempre ao seu alcance com preços acessíveis e ótimas condições! 💻 Acesse a loja completa no link", category: "Tecnologia" },
  { text: "O futuro digital é agora e você precisa estar preparado para as novidades! 🚀 Veja todos os produtos no link da bio", category: "Tecnologia" },
  { text: "Simplifique sua rotina diária com ferramentas inteligentes e soluções tecnológicas inovadoras! ⚡ Link na bio", category: "Tecnologia" },
  
  // Saúde & Bem-estar
  { text: "Cuide da sua saúde física e mental com nossos programas completos de bem-estar integral! 🧘‍♀️ Acesse todo o conteúdo no link da bio", category: "Saúde" },
  { text: "Viva com mais qualidade de vida e disposição seguindo nossas dicas especializadas todos os dias! 💚 Link na bio", category: "Saúde" },
  { text: "Descubra o equilíbrio perfeito entre corpo e mente com nossas práticas terapêuticas eficazes! 🌿 Saiba mais no link da bio", category: "Saúde" },
  
  // Decoração & Casa
  { text: "Transforme sua casa em um ambiente aconchegante e cheio de personalidade única! 🏠 Veja nossas inspirações no link da bio", category: "Decoração" },
  { text: "Decore cada cantinho do seu lar com muito estilo e bom gosto especial! ✨ Catálogo completo no link", category: "Decoração" },
  { text: "Crie ambientes incríveis que refletem sua essência e personalidade com nossas dicas exclusivas! 🛋️ Link na bio", category: "Decoração" },
  
  // Finanças & Investimentos
  { text: "Aprenda a investir seu dinheiro de forma inteligente e segura alcançando seus objetivos financeiros! 💰 Guia completo no link da bio", category: "Finanças" },
  { text: "Organize suas finanças pessoais e conquiste a tão sonhada independência financeira de verdade! 📊 Link na bio", category: "Finanças" },
  { text: "Multiplique seu patrimônio com estratégias comprovadas de investimento profissional e acessível! 💎 Acesse o curso no link da bio", category: "Finanças" },
  
  // Pets & Animais
  { text: "Tudo para o seu melhor amigo de quatro patas viver feliz e saudável sempre! 🐶 Produtos no link da bio", category: "Pets" },
  { text: "Cuidados especiais que seu pet merece receber com muito amor e dedicação profissional! 🐱 Link na bio", category: "Pets" },
  { text: "Faça seu animal de estimação ainda mais feliz com nossos produtos premium de qualidade! 🐾 Loja completa no link da bio", category: "Pets" },
];

const Ideas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-24">
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
