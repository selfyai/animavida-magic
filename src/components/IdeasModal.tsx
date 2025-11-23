import { useState } from "react";
import { Copy, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Frases Engraçadas e Descontraídas
  { text: "Prometo que não é golpe! Confira agora", category: "Humor" },
  { text: "Tá esperando o que? Confere já!", category: "Humor" },
  { text: "Melhor que pão de queijo! Acredite", category: "Humor" },
  { text: "Sua mãe ia adorar isso! Sério mesmo", category: "Humor" },
  { text: "É bom demais até pra ser verdade! Mas é", category: "Humor" },
  { text: "Sério, você VAI querer! Confia", category: "Humor" },
  { text: "Até minha vó quer! E olha que ela é exigente", category: "Humor" },
  
  // Motivacionais Descontraídos
  { text: "Bora ser feliz? Clica aqui!", category: "Motivação" },
  { text: "A vida é curta demais! Aproveita agora", category: "Motivação" },
  { text: "Porque você merece! E ponto final", category: "Motivação" },
  { text: "Vai por mim, você precisa disso! Confia", category: "Motivação" },
  { text: "Você no modo ON! Ativa agora", category: "Motivação" },
  
  // Call to Action Diretos
  { text: "Clica logo! O que tá esperando?", category: "CTA" },
  { text: "Bora! Não perde tempo", category: "CTA" },
  { text: "É agora ou nunca! Decide aí", category: "CTA" },
  { text: "Partiu? Vem comigo!", category: "CTA" },
  { text: "Não fica de fora! Entra logo", category: "CTA" },
];

interface IdeasModalProps {
  open: boolean;
  onClose: () => void;
}

const IdeasModal = ({ open, onClose }: IdeasModalProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Texto copiado!",
      description: "Cole no campo de texto da animação",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Sugestões de Ideias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar ideias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs"
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="grid gap-3">
              {filteredTemplates.map((template, index) => (
                <Card key={index} className="bg-background/50 border-border hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {template.category}
                        </Badge>
                        <p className="text-sm text-foreground">{template.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(template.text, `${index}`)}
                        className="flex-shrink-0"
                      >
                        {copiedId === `${index}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IdeasModal;
