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
  { text: "Vista sua melhor versão hoje", category: "Moda" },
  { text: "Estilo único para você brilhar", category: "Moda" },
  { text: "Looks incríveis te aguardam aqui", category: "Moda" },
  { text: "Transforme seu estilo com classe", category: "Moda" },
  
  // Alimentação
  { text: "Receitas deliciosas para você provar", category: "Alimentação" },
  { text: "Comida caseira que aquece corações", category: "Alimentação" },
  { text: "Sabor autêntico em cada mordida", category: "Alimentação" },
  { text: "Ingredientes frescos em pratos incríveis", category: "Alimentação" },
  
  // Fitness
  { text: "Transforme seu corpo começando agora", category: "Fitness" },
  { text: "Conquiste seu melhor shape hoje", category: "Fitness" },
  { text: "Resultados reais com treinos eficientes", category: "Fitness" },
  { text: "Alcance objetivos com acompanhamento profissional", category: "Fitness" },
  
  // Beleza
  { text: "Beleza natural com produtos especiais", category: "Beleza" },
  { text: "Cuide de você com tratamentos exclusivos", category: "Beleza" },
  { text: "Sua rotina perfeita começa aqui", category: "Beleza" },
  { text: "Realce sua beleza com qualidade", category: "Beleza" },
  
  // Negócios & Empreendedorismo
  { text: "Escale seu negócio digital hoje", category: "Negócios" },
  { text: "Estratégias comprovadas para alavancar vendas", category: "Negócios" },
  { text: "Transforme sua empresa com inovação", category: "Negócios" },
  { text: "Multiplique resultados com técnicas profissionais", category: "Negócios" },
  
  // Educação
  { text: "Aprenda com os melhores professores", category: "Educação" },
  { text: "Conhecimento que transforma vidas reais", category: "Educação" },
  { text: "Desenvolva habilidades para sua carreira", category: "Educação" },
  { text: "Invista no futuro com qualidade", category: "Educação" },
  
  // Viagens & Turismo
  { text: "Explore destinos incríveis pelo mundo", category: "Viagens" },
  { text: "Aventuras inesquecíveis te esperam aqui", category: "Viagens" },
  { text: "Roteiros perfeitos para suas férias", category: "Viagens" },
  { text: "Viaje com conforto e segurança", category: "Viagens" },
  
  // Tecnologia
  { text: "Inovação que facilita sua vida", category: "Tecnologia" },
  { text: "Tecnologia de ponta ao alcance", category: "Tecnologia" },
  { text: "Soluções inteligentes para você hoje", category: "Tecnologia" },
  { text: "Conecte-se com o futuro agora", category: "Tecnologia" },
  
  // Saúde & Bem-estar
  { text: "Cuide da saúde com carinho", category: "Saúde" },
  { text: "Bem-estar que transforma sua vida", category: "Saúde" },
  { text: "Qualidade de vida começa aqui", category: "Saúde" },
  { text: "Viva melhor com hábitos saudáveis", category: "Saúde" },
  
  // Pets
  { text: "Amor e carinho para seu pet", category: "Pets" },
  { text: "Produtos especiais para animais felizes", category: "Pets" },
  { text: "Cuide bem do seu melhor amigo", category: "Pets" },
  { text: "Tudo para seu pet viver bem", category: "Pets" },
  
  // Imóveis
  { text: "Encontre seu lar dos sonhos", category: "Imóveis" },
  { text: "Imóveis perfeitos para você morar", category: "Imóveis" },
  { text: "Realize o sonho da casa própria", category: "Imóveis" },
  { text: "Localizações privilegiadas te aguardam aqui", category: "Imóveis" },
  
  // Serviços
  { text: "Profissionais qualificados para você hoje", category: "Serviços" },
  { text: "Qualidade garantida em cada serviço", category: "Serviços" },
  { text: "Soluções práticas quando você precisa", category: "Serviços" },
  { text: "Atendimento rápido e eficiente sempre", category: "Serviços" },
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
