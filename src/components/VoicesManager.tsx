import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Volume2, Loader2 } from 'lucide-react';

interface VoiceSetting {
  id: string;
  voice_id: string;
  voice_name: string;
  is_enabled: boolean;
}

export const VoicesManager = () => {
  const [voices, setVoices] = useState<VoiceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('voice_settings')
      .select('*')
      .order('voice_name');

    if (error) {
      toast.error('Erro ao carregar vozes', {
        description: error.message,
      });
    } else {
      setVoices(data || []);
    }
    setLoading(false);
  };

  const toggleVoice = async (voiceId: string, currentStatus: boolean) => {
    setUpdating(voiceId);
    
    const { error } = await supabase
      .from('voice_settings')
      .update({ is_enabled: !currentStatus })
      .eq('voice_id', voiceId);

    if (error) {
      toast.error('Erro ao atualizar voz', {
        description: error.message,
      });
    } else {
      toast.success(
        !currentStatus ? 'Voz habilitada com sucesso' : 'Voz desabilitada com sucesso'
      );
      loadVoices();
    }
    
    setUpdating(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Vozes</CardTitle>
          <CardDescription>Habilite ou desabilite vozes disponíveis para os usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const enabledCount = voices.filter(v => v.is_enabled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Vozes</CardTitle>
        <CardDescription>
          Habilite ou desabilite vozes disponíveis para os usuários • {enabledCount} de {voices.length} vozes ativas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/50 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                  <Volume2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{voice.voice_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {voice.is_enabled ? 'Ativa' : 'Desativada'}
                  </div>
                </div>
              </div>
              <Switch
                checked={voice.is_enabled}
                onCheckedChange={() => toggleVoice(voice.voice_id, voice.is_enabled)}
                disabled={updating === voice.voice_id}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};