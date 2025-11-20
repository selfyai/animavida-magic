import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface FeatureCard {
  emoji: string;
  title: string;
  description: string;
}

interface HomePageContent {
  mainDescription: string;
  features: FeatureCard[];
  ctaButtonText: string;
}

const DEFAULT_CONTENT: HomePageContent = {
  mainDescription: 'Crie vídeos incríveis com inteligência artificial a partir de uma selfie',
  features: [
    {
      emoji: '📸',
      title: 'Capture',
      description: 'Tire e escolha uma foto',
    },
    {
      emoji: '🎙️',
      title: 'Voz',
      description: 'Escolha uma voz para narração',
    },
    {
      emoji: '✍️',
      title: 'Texto',
      description: 'Escreva o que deseja falar',
    },
    {
      emoji: '🎬',
      title: 'Gere',
      description: 'Crie seu vídeo com IA',
    },
  ],
  ctaButtonText: 'Criar Vídeo',
};

export function HomePageCMS() {
  const [content, setContent] = useState<HomePageContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'home_page_content')
        .maybeSingle();

      if (data?.value) {
        setContent(data.value as any as HomePageContent);
      }
    } catch (error) {
      console.error('Error loading home page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'home_page_content')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('app_settings')
          .update({
            value: content as any,
            description: 'Conteúdo da página inicial',
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'home_page_content');
      } else {
        await supabase
          .from('app_settings')
          .insert({
            key: 'home_page_content',
            value: content as any,
            description: 'Conteúdo da página inicial',
          } as any);
      }

      toast.success('Conteúdo salvo com sucesso!', {
        description: 'As alterações já estão visíveis na página inicial',
      });
    } catch (error: any) {
      console.error('Error saving home page content:', error);
      toast.error('Erro ao salvar conteúdo', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setContent({
      ...content,
      features: [
        ...content.features,
        { emoji: '✨', title: 'Nova Feature', description: 'Descrição da feature' },
      ],
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = content.features.filter((_, i) => i !== index);
    setContent({ ...content, features: newFeatures });
  };

  const updateFeature = (index: number, field: keyof FeatureCard, value: string) => {
    const newFeatures = [...content.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Página Inicial - CMS
        </CardTitle>
        <CardDescription>
          Edite o conteúdo da página inicial do seu aplicativo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Description */}
        <div className="space-y-2">
          <Label htmlFor="mainDescription">Descrição Principal</Label>
          <Textarea
            id="mainDescription"
            value={content.mainDescription}
            onChange={(e) => setContent({ ...content, mainDescription: e.target.value })}
            placeholder="Descreva o principal benefício do seu app"
            rows={3}
          />
        </div>

        <Separator />

        {/* Features Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cards de Features</h3>
              <p className="text-sm text-muted-foreground">
                Adicione ou edite os cards que aparecem na página inicial
              </p>
            </div>
            <Button onClick={addFeature} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {content.features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Card {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      disabled={content.features.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`emoji-${index}`}>Emoji</Label>
                      <Input
                        id={`emoji-${index}`}
                        value={feature.emoji}
                        onChange={(e) => updateFeature(index, 'emoji', e.target.value)}
                        placeholder="🎯"
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`title-${index}`}>Título</Label>
                      <Input
                        id={`title-${index}`}
                        value={feature.title}
                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                        placeholder="Título da feature"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`desc-${index}`}>Descrição</Label>
                      <Input
                        id={`desc-${index}`}
                        value={feature.description}
                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                        placeholder="Descrição breve"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* CTA Button */}
        <div className="space-y-2">
          <Label htmlFor="ctaButton">Texto do Botão Principal</Label>
          <Input
            id="ctaButton"
            value={content.ctaButtonText}
            onChange={(e) => setContent({ ...content, ctaButtonText: e.target.value })}
            placeholder="Ex: Criar Vídeo"
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  );
}
