import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VideoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
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

    loadVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Selfyai</h1>
          <p className="text-muted-foreground">Sua Selfie com IA</p>
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
