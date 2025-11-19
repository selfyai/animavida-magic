import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Download className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Instale o Selfyai</CardTitle>
          <CardDescription className="text-lg">
            Tenha acesso rápido ao app direto da tela inicial do seu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstallable && (
            <Button
              onClick={handleInstallClick}
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Instalar Agora
            </Button>
          )}

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <Smartphone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">No celular (Android)</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Toque no menu do navegador (⋮)</li>
                  <li>Selecione "Adicionar à tela inicial" ou "Instalar app"</li>
                  <li>Confirme a instalação</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Smartphone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">No iPhone (iOS)</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Toque no botão "Compartilhar" (□↑)</li>
                  <li>Role e toque em "Adicionar à Tela Inicial"</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Monitor className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">No computador</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Clique no ícone de instalação na barra de endereço</li>
                  <li>Ou acesse o menu do navegador e selecione "Instalar Selfyai"</li>
                  <li>Confirme a instalação</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Voltar para o início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;