import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProgressBar from "./ProgressBar";

interface GenerateVideoProps {
  open: boolean;
  onClose: () => void;
  imageData: string;
  voiceId: string;
  text: string;
}

const GenerateVideo = ({ open, onClose, imageData, voiceId, text }: GenerateVideoProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const generateVideo = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setStatusMessage("Preparando sua imagem...");

    try {
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatusMessage("Fazendo upload da imagem...");
      setProgress(20);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);
      
      const generatePromise = supabase.functions.invoke("generate-video", {
        body: { imageData, voiceId, text },
      });

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            const increment = Math.random() * 3;
            const newProgress = Math.min(prev + increment, 90);
            if (newProgress < 35) setStatusMessage("Processando sua imagem...");
            else if (newProgress < 55) setStatusMessage("Sintetizando a voz...");
            else if (newProgress < 75) setStatusMessage("Animando o personagem...");
            else setStatusMessage("Finalizando o vídeo...");
            return newProgress;
          }
          return prev;
        });
      }, 1000);

      const { data, error: functionError } = await generatePromise;
      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      if (functionError) throw new Error(functionError.message || "Erro ao chamar função");
      if (!data) throw new Error("Nenhuma resposta recebida da função");
      if (!data.success) throw new Error(data.error || "Falha ao gerar vídeo");

      setProgress(100);
      setStatusMessage("Vídeo pronto!");
      await new Promise(resolve => setTimeout(resolve, 500));
      setVideoUrl(data.videoUrl);
      toast.success("Vídeo gerado com sucesso!");
    } catch (err) {
      let errorMessage = "Erro ao gerar vídeo";
      if (err instanceof Error) {
        errorMessage = err.name === "AbortError" ? "Tempo limite excedido." : err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setVideoUrl(null);
    setError(null);
    setProgress(0);
    setStatusMessage("");
    setIsGenerating(false);
    onClose();
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download iniciado!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {videoUrl ? "Vídeo Gerado!" : isGenerating ? "Gerando Vídeo" : "Gerar Vídeo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isGenerating && !videoUrl && !error && (
            <Button onClick={generateVideo} className="w-full" size="lg">Gerar Vídeo</Button>
          )}
          {isGenerating && (
            <>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
              </div>
            </>
          )}
          {videoUrl && (
            <>
              <video src={videoUrl} controls className="w-full rounded-lg" />
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />Download
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">Fechar</Button>
              </div>
            </>
          )}
          {error && (
            <>
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive">{error}</div>
              <Button onClick={handleReset} variant="outline" className="w-full">Fechar</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateVideo;
