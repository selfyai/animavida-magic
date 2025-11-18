import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileNav from "@/components/MobileNav";
import CameraCapture from "@/components/CameraCapture";
import VoiceSelection from "@/components/VoiceSelection";
import TextInput from "@/components/TextInput";
import GenerateVideo from "@/components/GenerateVideo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { HeaderWithCredits } from "@/components/HeaderWithCredits";

type Step = "camera" | "voice" | "text" | "generate" | null;

const Index = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(null);
  const [imageData, setImageData] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleCameraClick = () => {
    setCurrentStep("camera");
  };

  const handleImageCapture = (data: string) => {
    setImageData(data);
  };

  const handleVoiceSelect = (id: string) => {
    setVoiceId(id);
  };

  const handleTextSubmit = (inputText: string) => {
    setText(inputText);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {isAuthenticated && <HeaderWithCredits />}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Crie vídeos animados
            <br />
            com IA
          </h2>
          <p className="text-muted-foreground">
            Transforme suas fotos em animações incríveis em segundos
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Capture</h3>
            <p className="text-sm text-muted-foreground">Tire ou escolha uma foto</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <span className="text-2xl">🎤</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Voz</h3>
            <p className="text-sm text-muted-foreground">Escolha a voz perfeita</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <span className="text-2xl">✍️</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Texto</h3>
            <p className="text-sm text-muted-foreground">Digite o que falar</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <span className="text-2xl">🎬</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Pronto!</h3>
            <p className="text-sm text-muted-foreground">Vídeo em segundos</p>
          </div>
        </div>

        {/* CTA */}
        {!loading && (
          <div className="text-center space-y-4">
            {isAuthenticated ? (
              <div className="p-6 rounded-2xl bg-gradient-primary shadow-glow">
                <p className="text-primary-foreground font-medium mb-2">
                  Toque no ícone da câmera abaixo
                </p>
                <p className="text-primary-foreground/80 text-sm">
                  para começar a criar seu primeiro vídeo animado
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-gradient-primary shadow-glow space-y-4">
                <p className="text-primary-foreground font-medium mb-2">
                  Crie sua conta para começar
                </p>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Ganhe 1 crédito grátis ao criar sua conta!
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-background text-foreground hover:bg-background/90"
                >
                  Criar Conta Grátis
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <MobileNav onCameraClick={handleCameraClick} />
      )}

      {/* Step Modals */}
      <CameraCapture
        open={currentStep === "camera"}
        onClose={() => setCurrentStep(null)}
        onCapture={handleImageCapture}
        onNext={() => setCurrentStep("voice")}
      />

      <VoiceSelection
        open={currentStep === "voice"}
        onClose={() => setCurrentStep(null)}
        onSelect={handleVoiceSelect}
        onNext={() => setCurrentStep("text")}
      />

      <TextInput
        open={currentStep === "text"}
        onClose={() => setCurrentStep(null)}
        onSubmit={handleTextSubmit}
        onNext={() => setCurrentStep("generate")}
      />

      <GenerateVideo
        open={currentStep === "generate"}
        onClose={() => setCurrentStep(null)}
        imageData={imageData}
        voiceId={voiceId}
        text={text}
      />
    </div>
  );
};

export default Index;
