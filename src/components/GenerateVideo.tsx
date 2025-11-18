import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Play, Download } from "lucide-react";
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

  const generateVideo = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulating video generation - in production, this would call the LemonSlice API
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Mock video URL for demonstration
      setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    } catch (err) {
      setError("Erro ao gerar vídeo. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {videoUrl ? "Vídeo Gerado!" : "Gerar Vídeo"}
          </DialogTitle>
        </DialogHeader>

        <ProgressBar currentStep={4} totalSteps={4} />

        <div className="space-y-4">
          {!videoUrl ? (
            <>
              <div className="space-y-4 p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <img
                    src={imageData}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">Sua foto</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{text}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                onClick={generateVideo}
                disabled={isGenerating}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando vídeo...
                  </>
                ) : (
                  "Gerar Vídeo Animado"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="aspect-video rounded-xl overflow-hidden bg-secondary">
                <video src={videoUrl} controls className="w-full h-full">
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
                <Button
                  onClick={() => {
                    setVideoUrl(null);
                    onClose();
                  }}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  Criar Novo
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateVideo;
