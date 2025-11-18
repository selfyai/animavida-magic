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
  { text: "Seu estilo começa aqui! 👗✨ Confira nossas novidades no link da bio", category: "Moda" },
  { text: "Vista-se com atitude! 🔥 Coleção exclusiva disponível agora", category: "Moda" },
  { text: "Looks incríveis te esperando! Link na bio para comprar 🛍️", category: "Moda" },
  
  // Alimentação
  { text: "Receitas deliciosas todos os dias! 🍰 Acesse nosso site no link da bio", category: "Alimentação" },
  { text: "Comida que aquece o coração ❤️ Peça já pelo link na bio", category: "Alimentação" },
  { text: "Sabor que você não encontra em outro lugar! 🍕 Link na bio", category: "Alimentação" },
  
  // Fitness
  { text: "Transforme seu corpo! 💪 Programas de treino no link da bio", category: "Fitness" },
  { text: "Seu melhor shape começa hoje! 🏋️ Acesse o link na bio", category: "Fitness" },
  { text: "Resultados reais, treinos eficientes! Link na bio 🔥", category: "Fitness" },
  
  // Beleza
  { text: "Beleza natural e radiante! ✨ Produtos no link da bio", category: "Beleza" },
  { text: "Cuide de você com carinho 💅 Acesse nosso catálogo no link", category: "Beleza" },
  { text: "Sua rotina de skincare ideal te espera! Link na bio 🌸", category: "Beleza" },
  
  // Negócios
  { text: "Escale seu negócio hoje! 📈 Consultoria gratuita no link da bio", category: "Negócios" },
  { text: "Estratégias que funcionam! 💼 Conheça nossos serviços no link", category: "Negócios" },
  { text: "Transforme sua empresa! 🚀 Saiba mais no link da bio", category: "Negócios" },
  
  // Educação
  { text: "Aprenda com os melhores! 📚 Cursos disponíveis no link da bio", category: "Educação" },
  { text: "Conhecimento que transforma! 🎓 Acesse nossos materiais no link", category: "Educação" },
  { text: "Desenvolva novas habilidades! 💡 Link na bio", category: "Educação" },
  
  // Viagens
  { text: "Seu próximo destino te espera! ✈️ Pacotes no link da bio", category: "Viagens" },
  { text: "Viva experiências inesquecíveis! 🌍 Confira no link", category: "Viagens" },
  { text: "Explore o mundo com a gente! 🗺️ Link na bio", category: "Viagens" },
  
  // Tecnologia
  { text: "Inovação que facilita sua vida! 📱 Conheça no link da bio", category: "Tecnologia" },
  { text: "Tecnologia de ponta ao seu alcance! 💻 Acesse o link", category: "Tecnologia" },
  { text: "O futuro é agora! 🚀 Produtos no link da bio", category: "Tecnologia" },
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
