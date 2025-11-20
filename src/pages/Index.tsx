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
import { InstallPWABanner } from "@/components/InstallPWABanner";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
type Step = "camera" | "voice" | "text" | "generate" | null;
const Index = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(null);
  const [imageData, setImageData] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number>(0);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
      if (session?.user) {
        loadUserCredits(session.user.id);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        loadUserCredits(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const loadUserCredits = async (userId: string) => {
    const {
      data
    } = await supabase.from('profiles').select('credits').eq('id', userId).maybeSingle();
    if (data) {
      setUserCredits(data.credits);
    }
  };
  const handleCameraClick = () => {
    if (userCredits <= 0) {
      toast.error("Créditos insuficientes", {
        description: "Você precisa de créditos para criar um vídeo. Compre mais créditos para continuar."
      });
      return;
    }
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
  return <div className="min-h-screen bg-background pb-24 md:pb-0">
      {isAuthenticated && <HeaderWithCredits />}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-20 md:pt-8 pb-4">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-10 mx-auto mb-4" />
          
          <p className="text-muted-foreground">Crie vídeos incríveis com inteligência artificial a partir de uma selfie  </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Capture</h3>
            <p className="text-sm text-muted-foreground">Tire e escolha uma foto</p>
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
        {!loading && <div className="text-center space-y-4">
            {isAuthenticated ? <div className="p-6 rounded-2xl bg-gradient-primary shadow-glow">
                <p className="text-primary-foreground font-medium mb-2">
                  Toque no ícone da câmera abaixo
                </p>
                <p className="text-primary-foreground/80 text-sm">
                  para começar a criar seu primeiro vídeo animado
                </p>
              </div> : <div className="p-6 rounded-2xl bg-gradient-primary shadow-glow space-y-4">
                <p className="text-primary-foreground font-medium mb-2">
                  Crie sua conta para começar
                </p>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Ganhe 1 crédito grátis ao criar sua conta!
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => navigate('/auth?mode=signup')} className="flex-1 bg-background text-foreground hover:bg-background/90">
                    Criar Conta Grátis
                  </Button>
                  <Button onClick={() => navigate('/auth?mode=login')} className="flex-1 bg-background text-foreground hover:bg-background/80 border border-foreground/20">
                    Entrar
                  </Button>
                </div>
              </div>}
          </div>}
      </main>

      {/* Mobile Navigation */}
      {isAuthenticated && <MobileNav onCameraClick={handleCameraClick} />}

      {/* Step Modals */}
      <CameraCapture open={currentStep === "camera"} onClose={() => setCurrentStep(null)} onCapture={handleImageCapture} onNext={() => setCurrentStep("voice")} />

      <VoiceSelection open={currentStep === "voice"} onClose={() => setCurrentStep(null)} onSelect={handleVoiceSelect} onNext={() => setCurrentStep("text")} />

      <TextInput open={currentStep === "text"} onClose={() => setCurrentStep(null)} onSubmit={handleTextSubmit} onNext={() => setCurrentStep("generate")} />

      <GenerateVideo open={currentStep === "generate"} onClose={() => setCurrentStep(null)} imageData={imageData} voiceId={voiceId} text={text} />
      
      <InstallPWABanner />
    </div>;
};
export default Index;