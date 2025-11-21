import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VideoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setCheckingAuth(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        // Recarregar o vídeo quando o usuário fizer login
        loadVideo();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!checkingAuth && isAuthenticated) {
      loadVideo();
    }
  }, [id, isAuthenticated, checkingAuth]);

  const loadVideo = async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("generated_videos")
        .select("video_url")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError(true);
        toast.error("Vídeo não encontrado");
      } else {
        setVideoUrl(data.video_url);
      }
    } catch (err) {
      console.error("Error loading video:", err);
      setError(true);
      toast.error("Erro ao carregar vídeo");
    } finally {
      setLoading(false);
    }
  };

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <Video className="h-24 w-24 text-primary" />
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Selfyai</h1>
            <p className="text-xl font-semibold text-primary">
              Vídeo Exclusivo para Membros
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <p className="text-muted-foreground">
              Este vídeo está disponível apenas para usuários cadastrados.
            </p>
            
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <Sparkles className="h-5 w-5" />
                <span>Oferta de Boas-Vindas</span>
              </div>
              <p className="text-sm">
                Crie sua conta <span className="font-bold">gratuitamente</span> e ganhe{" "}
                <span className="font-bold text-primary">1 crédito</span> para gerar seu próprio vídeo com IA!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full" 
              size="lg"
            >
              Criar Conta Grátis e Ver Vídeo
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Voltar para página inicial
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Já tem uma conta?{" "}
            <button 
              onClick={() => navigate('/auth')} 
              className="text-primary hover:underline font-semibold"
            >
              Faça login aqui
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">Vídeo não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          O vídeo que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => navigate("/")}>
          Ir para página inicial
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto pt-safe">
      <div className="max-w-4xl w-full mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-accent"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">Selfyai</h1>
            <p className="text-sm text-muted-foreground">Sua Selfie com IA</p>
          </div>
          <div className="w-10"></div>
        </div>
        
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full"
          >
            Seu navegador não suporta a reprodução de vídeos.
          </video>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pb-8">
          <Button onClick={() => navigate("/")} className="w-full sm:w-auto">
            Criar seu próprio vídeo
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copiado!");
            }}
            className="w-full sm:w-auto"
          >
            Copiar link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoView;
