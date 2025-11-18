import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Check, Upload } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setError(null);
      console.log("🎥 Iniciando câmera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Câmera não disponível neste navegador");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log("✅ Stream obtido");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            console.log("✅ Vídeo reproduzindo");
            setStream(mediaStream);
          }).catch(err => {
            console.error("Erro ao reproduzir vídeo:", err);
            setError("Erro ao iniciar visualização");
          });
        };
      }
    } catch (err) {
      console.error("❌ Erro ao acessar câmera:", err);
      let errorMsg = "Não foi possível acessar a câmera";
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMsg = "Permissão negada. Autorize o acesso à câmera.";
        } else if (err.name === "NotFoundError") {
          errorMsg = "Nenhuma câmera encontrada.";
        } else if (err.name === "NotReadableError") {
          errorMsg = "Câmera em uso por outro app.";
        }
      }
      
      setError(errorMsg);
      toast({
        title: "Erro na câmera",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
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
    setImage(null);
    setError(null);
    startCamera();
  };

  const handleNext = () => {
    stopCamera();
    onNext();
  };

  const handleClose = () => {
    stopCamera();
    setImage(null);
    setError(null);
    onClose();
  };

  // Iniciar câmera quando modal abrir
  useEffect(() => {
    if (open && !image) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Limpar ao fechar
  useEffect(() => {
    if (!open) {
      stopCamera();
      setImage(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Capturar Foto</DialogTitle>
        </DialogHeader>

        <ProgressBar currentStep={1} totalSteps={4} />

        <div className="space-y-4">
          {!image ? (
            <>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50">
                {stream && !error ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                    <Camera className="w-16 h-16 text-muted-foreground" />
                    {error ? (
                      <p className="text-sm text-destructive">{error}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aguarde...</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {stream && !error ? (
                  <Button
                    onClick={capturePhoto}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Tirar Foto
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={startCamera}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                      disabled={!error && !stream}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {error ? "Tentar Novamente" : "Abrir Câmera"}
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Galeria
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <img src={image} alt="Foto capturada" className="w-full h-full object-cover" />
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
            capture="user"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
