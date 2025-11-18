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
  { text: "Vista sua melhor versão hoje mesmo", category: "Moda" },
  { text: "Estilo único pra você brilhar sempre", category: "Moda" },
  { text: "Looks incríveis aguardam por você aqui", category: "Moda" },
  { text: "Transforme seu estilo com muita classe", category: "Moda" },
  
  // Alimentação
  { text: "Receitas deliciosas pra você provar agora", category: "Alimentação" },
  { text: "Comida caseira que aquece seu coração", category: "Alimentação" },
  { text: "Sabor autêntico em cada mordida aqui", category: "Alimentação" },
  { text: "Ingredientes frescos em pratos muito incríveis", category: "Alimentação" },
  
  // Fitness
  { text: "Transforme seu corpo começando hoje mesmo", category: "Fitness" },
  { text: "Conquiste seu melhor shape agora aqui", category: "Fitness" },
  { text: "Resultados reais com treinos super eficientes", category: "Fitness" },
  { text: "Alcance objetivos com acompanhamento bem profissional", category: "Fitness" },
  
  // Beleza
  { text: "Beleza natural com produtos muito especiais", category: "Beleza" },
  { text: "Cuide de você com tratamentos exclusivos", category: "Beleza" },
  { text: "Sua rotina perfeita começa aqui agora", category: "Beleza" },
  { text: "Realce sua beleza com muita qualidade", category: "Beleza" },
  
  // Negócios & Empreendedorismo
  { text: "Escale seu negócio digital hoje mesmo", category: "Negócios" },
  { text: "Estratégias comprovadas pra alavancar vendas rápido", category: "Negócios" },
  { text: "Transforme sua empresa com inovação agora", category: "Negócios" },
  { text: "Multiplique resultados com técnicas bem profissionais", category: "Negócios" },
  
  // Educação
  { text: "Aprenda com os melhores professores aqui", category: "Educação" },
  { text: "Conhecimento que transforma vidas reais agora", category: "Educação" },
  { text: "Desenvolva habilidades pra sua carreira crescer", category: "Educação" },
  { text: "Invista no futuro com muita qualidade", category: "Educação" },
  
  // Viagens & Turismo
  { text: "Explore destinos incríveis pelo mundo agora", category: "Viagens" },
  { text: "Aventuras inesquecíveis esperam por você aqui", category: "Viagens" },
  { text: "Roteiros perfeitos pra suas férias incríveis", category: "Viagens" },
  { text: "Viaje com conforto e segurança total", category: "Viagens" },
  
  // Tecnologia
  { text: "Inovação que facilita sua vida agora", category: "Tecnologia" },
  { text: "Tecnologia de ponta ao seu alcance", category: "Tecnologia" },
  { text: "Soluções inteligentes pra você hoje mesmo", category: "Tecnologia" },
  { text: "Conecte com o futuro agora mesmo", category: "Tecnologia" },
  
  // Saúde & Bem-estar
  { text: "Cuide da saúde com muito carinho", category: "Saúde" },
  { text: "Bem estar transforma sua vida agora", category: "Saúde" },
  { text: "Qualidade de vida começa aqui hoje", category: "Saúde" },
  { text: "Viva melhor com hábitos muito saudáveis", category: "Saúde" },
  
  // Pets
  { text: "Amor e carinho pro seu pet", category: "Pets" },
  { text: "Produtos especiais pra animais muito felizes", category: "Pets" },
  { text: "Cuide bem do seu melhor amigo", category: "Pets" },
  { text: "Tudo pro seu pet viver bem", category: "Pets" },
  
  // Imóveis
  { text: "Encontre seu lar dos sonhos aqui", category: "Imóveis" },
  { text: "Imóveis perfeitos pra você morar bem", category: "Imóveis" },
  { text: "Realize o sonho da casa própria", category: "Imóveis" },
  { text: "Localizações privilegiadas esperam por você aqui", category: "Imóveis" },
  
  // Serviços
  { text: "Profissionais qualificados pra você hoje mesmo", category: "Serviços" },
  { text: "Qualidade garantida em cada serviço aqui", category: "Serviços" },
  { text: "Soluções práticas quando você precisa agora", category: "Serviços" },
  { text: "Atendimento rápido e eficiente sempre aqui", category: "Serviços" },
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
