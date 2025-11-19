import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "./ProgressBar";
import { supabase } from "@/integrations/supabase/client";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  onNext: () => void;
}

const CameraCapture = ({ open, onClose, onCapture, onNext }: CameraCaptureProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [galleryEnabled, setGalleryEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadGallerySetting = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'gallery_button_enabled')
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar configuração de galeria:', error);
          return;
        }
        
        if (data && typeof data.value === 'object' && data.value !== null) {
          const value = data.value as { enabled: boolean };
          setGalleryEnabled(value.enabled);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };

    if (open) {
      loadGallerySetting();
    }
  }, [open]);

  const startCamera = async () => {
    console.log("🎥 [1] Iniciando câmera...");
    setLoading(true);
    
    try {
      // Verificar suporte
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ getUserMedia não suportado");
        throw new Error("Seu navegador não suporta acesso à câmera");
      }

      console.log("📱 [2] Solicitando permissão...");
      
      // Constraints otimizadas para mobile (iOS e Android)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false
      });

      console.log("✅ [3] Permissão concedida, stream obtido");
      streamRef.current = stream;

      // Aguardar elemento de vídeo estar disponível
      if (!videoRef.current) {
        console.error("❌ [4] Elemento de vídeo não encontrado");
        throw new Error("Elemento de vídeo não disponível");
      }

      console.log("📺 [5] Conectando stream ao vídeo...");
      videoRef.current.srcObject = stream;
      
      // Aguardar vídeo carregar
      videoRef.current.onloadedmetadata = () => {
        console.log("✅ [6] Metadata carregada");
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              console.log("✅ [7] Vídeo reproduzindo!");
              setCameraActive(true);
              setLoading(false);
            })
            .catch(err => {
              console.error("❌ [8] Erro ao reproduzir:", err);
              setLoading(false);
              toast({
                title: "Erro",
                description: "Erro ao iniciar visualização da câmera",
                variant: "destructive",
              });
            });
        }
      };

      videoRef.current.onerror = (err) => {
        console.error("❌ Erro no elemento de vídeo:", err);
        setLoading(false);
      };

    } catch (error) {
      console.error("❌ Erro ao acessar câmera:", error);
      setLoading(false);
      
      let errorMessage = "Não foi possível acessar a câmera";
      if (error instanceof Error) {
        console.error("Tipo de erro:", error.name, error.message);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Permissão negada. Autorize o acesso à câmera nas configurações.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage = "Nenhuma câmera encontrada no dispositivo.";
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMessage = "Câmera está sendo usada por outro aplicativo.";
        } else {
          errorMessage = error.message;
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("⏹️ Track parado:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLoading(false);
  };

  const capturePhoto = () => {
    console.log("📸 Capturando foto...");
    if (!videoRef.current || !cameraActive) {
      console.error("❌ Vídeo não está ativo");
      return;
    }

    try {
      setLoading(true);
      const canvas = document.createElement("canvas");
      
      // Limitar tamanho para evitar problemas de memória em mobile
      const maxWidth = 1280;
      const maxHeight = 1280;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      console.log("📐 Dimensões otimizadas:", canvas.width, "x", canvas.height);
      
      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) {
        throw new Error("Erro ao obter contexto do canvas");
      }

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Comprimir para JPEG com qualidade 0.85 para mobile
      const imageData = canvas.toDataURL("image/jpeg", 0.85);
      
      console.log("✅ Foto capturada e otimizada");
      
      // Parar câmera primeiro para liberar recursos
      stopCamera();
      
      // Pequeno delay para garantir que o DOM atualize
      setTimeout(() => {
        setImage(imageData);
        onCapture(imageData);
        setLoading(false);
      }, 100);
      
    } catch (error) {
      console.error("❌ Erro ao capturar foto:", error);
      setLoading(false);
      stopCamera();
      toast({
        title: "Erro",
        description: "Não foi possível capturar a foto",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📁 Arquivo selecionado:", file.name);
    setLoading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      
      // Comprimir imagem da galeria também
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1280;
        const maxHeight = 1280;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL("image/jpeg", 0.85);
          setImage(compressedData);
          onCapture(compressedData);
          setLoading(false);
          console.log("✅ Imagem carregada e otimizada da galeria");
        }
      };
      img.src = imageData;
    };
    reader.onerror = () => {
      setLoading(false);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a imagem",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    console.log("🔄 Refazer foto");
    stopCamera(); // Garantir que câmera está parada
    setImage(null);
    setCameraActive(false);
    setLoading(false);
  };

  const handleNext = () => {
    stopCamera();
    onNext();
  };

  const handleClose = () => {
    console.log("❌ Fechando modal");
    stopCamera();
    setImage(null);
    onClose();
  };

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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <Camera className="w-16 h-16 text-muted-foreground" />
                    {loading ? (
                      <div className="space-y-2">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">Iniciando câmera...</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Clique em "Abrir Câmera" para começar</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {cameraActive ? (
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
                      disabled={loading}
                      className={`bg-gradient-primary hover:opacity-90 ${galleryEnabled ? 'flex-1' : 'w-full'}`}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Abrir Câmera
                    </Button>
                    {galleryEnabled && (
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        className="flex-1"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Galeria
                      </Button>
                    )}
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
