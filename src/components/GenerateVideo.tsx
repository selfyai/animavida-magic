import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download, Share2 } from "lucide-react";
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
      setStatusMessage("Carregando… porque magia também leva tempo...");

    try {
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatusMessage("Fazendo upload da imagem...");
      setProgress(20);
      
      const generatePromise = supabase.functions.invoke("generate-video", {
        body: { imageData, voiceId, text },
      });

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) {
            const increment = Math.random() * 1.2;
            const newProgress = Math.min(prev + increment, 85);
            if (newProgress < 25) setStatusMessage("Carregando… porque magia também leva tempo...");
            else if (newProgress < 40) setStatusMessage("Aguarde… a imagem foi buscar um café...");
            else if (newProgress < 55) setStatusMessage("Gerando áudio da voz...");
            else if (newProgress < 70) setStatusMessage("Sintetizando lip-sync...");
            else setStatusMessage("Renderizando vídeo final, pode levar vários minutos...");
            return newProgress;
          }
          return prev;
        });
      }, 2000);

      const { data, error: functionError } = await generatePromise;
      clearInterval(progressInterval);

      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(`Erro na geração: ${functionError.message || JSON.stringify(functionError)}`);
      }
      if (!data) {
        console.error("No data received from edge function");
        throw new Error("Nenhuma resposta recebida da API");
      }
      if (!data.success) {
        console.error("Edge function returned error:", data.error);
        throw new Error(data.error || "Falha ao gerar vídeo - verifique sua chave API");
      }

      setProgress(100);
      setStatusMessage("Vídeo pronto!");
      await new Promise(resolve => setTimeout(resolve, 500));
      setVideoUrl(data.videoUrl);
      toast.success("Vídeo gerado com sucesso!");
    } catch (err) {
      console.error("Video generation error:", err);
      let errorMessage = "Erro ao gerar vídeo. ";
      if (err instanceof Error) {
        errorMessage += err.message;
      }
      console.error("Full error details:", JSON.stringify(err, null, 2));
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

  const handleShare = (platform: string) => {
    if (!videoUrl) return;
    
    const shareText = "Confira este vídeo incrível criado com Alicia!";
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(videoUrl);
    
    let shareUrl = "";
    
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "instagram":
        // Instagram não permite compartilhamento direto via URL, então copiamos o link
        navigator.clipboard.writeText(videoUrl);
        toast.success("Link copiado! Cole no Instagram para compartilhar.");
        return;
      case "copy":
        navigator.clipboard.writeText(videoUrl);
        toast.success("Link copiado!");
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
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
            <>
              <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border">
                <p className="text-sm font-medium text-foreground">Resumo do vídeo:</p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="text-xs text-muted-foreground font-medium min-w-[60px]">Imagem:</div>
                    <div className="flex-1">
                      <img 
                        src={imageData} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-lg object-cover border border-border"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-xs text-muted-foreground font-medium min-w-[60px]">Voz:</div>
                    <div className="flex-1 text-sm text-foreground">
                      {voiceId === "pNInz6obpgDQGcFmaJgB" && "Adalberto - Voz de Geladeira Brastemp"}
                      {voiceId === "nbk2esDn4RRk4cVDdoiE" && "Aline - Garganta de Chaleira da Vovó"}
                      {voiceId === "ZF6FPAbjXT4488VcRRnw" && "Amélia - Risada de Pomba da Praça"}
                      {voiceId === "9EU0h6CVtEDS6vriwwq5" && "Andréa - Língua Turbo de Feira"}
                      {voiceId === "ZkXXWlhJO3CtSXof2ujN" && "Ana Vitória - 220V do Paraguai"}
                      {voiceId === "BY77WcifAQZkoI7EftFd" && "Vanessa - Ventinho de Ventilador Mondial"}
                      {voiceId === "qNkzaJoHLLdpvgh5tISm" && "Bruno - Estoura-Tímpano do Sertão"}
                      {voiceId === "txtf1EDouKke753vN8SL" && "Camila - Gargalo de Garrafa PET"}
                      {voiceId === "IHngRooVccHyPqB4uQkG" && "Clemente - Voz de Pudim Queimado"}
                      {voiceId === "AnvlJBAqSLDzEevYr9Ap" && "Emanuela - Barulho de Submarino de Isopor"}
                      {voiceId === "BZc8d1MPTdZkyGbE9Sin" && "Francisca - Grito de Macarronada"}
                      {voiceId === "JBFqnCBsd6RMkjVDRZzb" && "Jorge - Trovão do Interior"}
                      {voiceId === "fzDFBB4mgvMlL36gPXcz" && "Geovani - Ronco de Moto CG Tuning"}
                      {voiceId === "i4CzbCVWoqvD0P1QJCUL" && "Íris - Estalo de Fio Desencapado"}
                      {voiceId === "NOpBlnGInO9m6vDvFkFC" && "João - Ventilador de Parede"}
                      {voiceId === "gAMZphRyrWJnLMDnom6H" && "Kelvin - Motor de Fusca 78 Falante"}
                      {voiceId === "rCuVrCHOUMY3OwyJBJym" && "Mila - Panela de Pressão Cantante"}
                      {voiceId === "LT7npgnEogysurF7U8GR" && "Rosana - Chá de Camomila Borbulhante"}
                      {voiceId === "ZRwrL4id6j1HPGFkeCzO" && "Samuel - Rádio AM Pirata"}
                      {voiceId === "LtPsVjX1k0Kl4StEMZPK" && "Sofia - Sussurro de Neblina do Brejo"}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-xs text-muted-foreground font-medium min-w-[60px]">Texto:</div>
                    <div className="flex-1 text-sm text-foreground line-clamp-3">
                      {text}
                    </div>
                  </div>
                </div>
              </div>
              
              <Button onClick={generateVideo} className="w-full" size="lg">Gerar Vídeo</Button>
            </>
          )}
          {isGenerating && (
            <>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-muted-foreground">{statusMessage}</p>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          )}
          {videoUrl && (
            <>
              <div className="relative rounded-lg overflow-hidden">
                <video src={videoUrl} controls className="w-full rounded-lg" />
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
                  <span className="text-white text-xs font-medium">Feito com Alicia</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />Download
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">Fechar</Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    <span>Compartilhar</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      onClick={() => handleShare("whatsapp")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <span className="text-xs">WhatsApp</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleShare("facebook")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-xs">Facebook</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleShare("instagram")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                      </svg>
                      <span className="text-xs">Instagram</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleShare("copy")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                      <span className="text-xs">Copiar</span>
                    </Button>
                  </div>
                </div>
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
