import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "./ProgressBar";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  onNext: () => void;
}

const CameraCapture = ({ open, onClose, onCapture, onNext }: CameraCaptureProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    console.log("🎥 Tentando iniciar câmera...");
    setIsLoading(true);
    
    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera");
      }

      console.log("📱 Solicitando permissão da câmera...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      console.log("✅ Câmera autorizada, iniciando stream...");
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        console.log("✅ Câmera iniciada com sucesso!");
      }
      
      setStream(mediaStream);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Erro ao acessar câmera:", error);
      setIsLoading(false);
      
      let errorMessage = "Não foi possível acessar a câmera";
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Permissão negada. Por favor, autorize o acesso à câmera nas configurações do navegador.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Nenhuma câmera encontrada no dispositivo.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Câmera está sendo usada por outro aplicativo.";
        }
      }
      
      toast({
        title: "Erro na câmera",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    console.log("⏹️ Parando câmera...");
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/png");
        setImage(imageData);
        onCapture(imageData);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    console.log("🔄 Refazer foto...");
    setImage(null);
    startCamera();
  };

  const handleNext = () => {
    stopCamera();
    onNext();
  };

  // Iniciar câmera automaticamente quando o modal abrir
  useEffect(() => {
    console.log("🔄 useEffect executado - open:", open, "image:", !!image, "stream:", !!stream);
    
    if (open && !image) {
      console.log("🚀 Iniciando câmera automaticamente...");
      startCamera();
    }
    
    // Cleanup: parar câmera quando o componente desmontar ou modal fechar
    return () => {
      if (stream) {
        console.log("🛑 Limpeza: parando câmera...");
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Capturar Foto</DialogTitle>
        </DialogHeader>

        <ProgressBar currentStep={1} totalSteps={4} />

        <div className="space-y-4">
          {!image ? (
            <>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
                {stream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Camera className="w-16 h-16 text-muted-foreground" />
                    {isLoading && <p className="text-sm text-muted-foreground">Iniciando câmera...</p>}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!stream ? (
                  <>
                    <Button
                      onClick={startCamera}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Abrir Câmera
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      className="flex-1"
                    >
                      Escolher Arquivo
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={capturePhoto}
                    className="w-full bg-gradient-primary hover:opacity-90"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Tirar Foto
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <img src={image} alt="Captured" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-3">
                <Button onClick={retake} variant="secondary" className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refazer
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
