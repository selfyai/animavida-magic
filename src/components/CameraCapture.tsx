import { useState, useRef } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
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
    setImage(null);
    startCamera();
  };

  const handleNext = () => {
    stopCamera();
    onNext();
  };

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
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="w-16 h-16 text-muted-foreground" />
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
