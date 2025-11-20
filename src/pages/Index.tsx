import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileNav from "@/components/MobileNav";
import CameraCapture from "@/components/CameraCapture";
import VoiceSelection from "@/components/VoiceSelection";
import TextInput from "@/components/TextInput";
import GenerateVideo from "@/components/GenerateVideo";
import { Button } from "@/components/ui/button";
import { HeaderWithCredits } from "@/components/HeaderWithCredits";
import { InstallPWABanner } from "@/components/InstallPWABanner";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";

type Step = "camera" | "voice" | "text" | "generate" | null;

interface FeatureCard {
  emoji: string;
  title: string;
  description: string;
}

interface HomePageContent {
  mainDescription: string;
  features: FeatureCard[];
  ctaButtonText: string;
}

const DEFAULT_CONTENT: HomePageContent = {
  mainDescription: 'Crie vídeos incríveis com inteligência artificial a partir de uma selfie',
  features: [
    { emoji: '📸', title: 'Capture', description: 'Tire e escolha uma foto' },
    { emoji: '🎤', title: 'Voz', description: 'Escolha a voz perfeita' },
    { emoji: '✍️', title: 'Texto', description: 'Digite o que falar' },
    { emoji: '🎬', title: 'Pronto!', description: 'Vídeo em segundos' },
  ],
  ctaButtonText: 'Criar Vídeo',
};

const Index = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(null);
  const [imageData, setImageData] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [homeContent, setHomeContent] = useState<HomePageContent>(DEFAULT_CONTENT);
  
  // Detect and update user platform
  usePlatformDetection(userId);
  
  useEffect(() => {
    loadHomeContent();
  }, []);

  const loadHomeContent = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'home_page_content')
        .maybeSingle();

      if (data?.value) {
        setHomeContent(data.value as any as HomePageContent);
      }
    } catch (error) {
      console.error('Error loading home page content:', error);
    }
  };
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
      if (session?.user) {
        setUserId(session.user.id);
        loadUserCredits(session.user.id);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
        loadUserCredits(session.user.id);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const loadUserCredits = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();
    
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

  return (
    <div className="min-h-screen bg-background pb-safe-mobile">
      {isAuthenticated && <HeaderWithCredits />}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-20 md:pt-8 pb-4">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-10 mx-auto mb-4" />
          <p className="text-muted-foreground">{homeContent.mainDescription}</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {homeContent.features.map((feature, index) => (
            <div key={index} className="p-4 rounded-2xl bg-gradient-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl">{feature.emoji}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
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
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate('/auth?mode=signup')} 
                    className="flex-1 bg-background text-foreground hover:bg-background/90"
                  >
                    Criar Conta Grátis
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth?mode=login')} 
                    className="flex-1 bg-background text-foreground hover:bg-background/80 border border-foreground/20"
                  >
                    Entrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      {isAuthenticated && <MobileNav onCameraClick={handleCameraClick} />}

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
      
      <InstallPWABanner />
    </div>
  );
};

export default Index;
