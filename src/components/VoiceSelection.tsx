import { useState } from "react";
import { Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ProgressBar from "./ProgressBar";

interface Voice {
  id: string;
  name: string;
  country: string;
  style: string;
}

const voices: Voice[] = [
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adão", country: "🇺🇸", style: "Voz de Geladeira Velha" },
  { id: "nbk2esDn4RRk4cVDdoiE", name: "Alice", country: "🇬🇧", style: "Garganta de Chaleira" },
  { id: "ZF6FPAbjXT4488VcRRnw", name: "Amelia", country: "🇦🇺", style: "Riso de Hiena" },
  { id: "9EU0h6CVtEDS6vriwwq5", name: "Andrea", country: "🇮🇹", style: "Lingueta Turbo" },
  { id: "ZkXXWlhJO3CtSXof2ujN", name: "Ava", country: "🇺🇸", style: "220 Volts Falantes" },
  { id: "BY77WcifAQZkoI7EftFd", name: "Avani", country: "🇮🇳", style: "Sopradora de Tempestade" },
  { id: "qNkzaJoHLLdpvgh5tISm", name: "Buck", country: "🇺🇸", style: "Quebra-Tímpano" },
  { id: "txtf1EDouKke753vN8SL", name: "Camille", country: "🇫🇷", style: "Gargalo de Champanhe" },
  { id: "IHngRooVccHyPqB4uQkG", name: "Corentin", country: "🇫🇷", style: "Voz de Sobremesa Queimada" },
  { id: "AnvlJBAqSLDzEevYr9Ap", name: "Emma", country: "🇬🇧", style: "Barulho de Submarino" },
  { id: "BZc8d1MPTdZkyGbE9Sin", name: "Francesca", country: "🇮🇹", style: "Grito Espaguetudo" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", country: "🇬🇧", style: "Pegada de Trovão Inglês" },
  { id: "fzDFBB4mgvMlL36gPXcz", name: "Giovanni", country: "🇮🇹", style: "Rugido de Vespa Tuning" },
  { id: "i4CzbCVWoqvD0P1QJCUL", name: "Ivy", country: "🇦🇺", style: "Estalo de Cabos Soltos" },
  { id: "NOpBlnGInO9m6vDvFkFC", name: "Joe", country: "🇺🇸", style: "Sotaque de Ventilador" },
  { id: "gAMZphRyrWJnLMDnom6H", name: "Kevin", country: "🇺🇸", style: "Motor de Fusca Falante" },
  { id: "rCuVrCHOUMY3OwyJBJym", name: "Mia", country: "🇺🇸", style: "Voz de Panela de Pressão" },
  { id: "LT7npgnEogysurF7U8GR", name: "Rosie", country: "🇬🇧", style: "Cantiga de Chá Fervendo" },
  { id: "ZRwrL4id6j1HPGFkeCzO", name: "Sam", country: "🇺🇸", style: "Ruído de Rádio Pirata" },
  { id: "LtPsVjX1k0Kl4StEMZPK", name: "Sophia", country: "🇺🇸", style: "Sussurro de Neblina Maluca" },
];

interface VoiceSelectionProps {
  open: boolean;
  onClose: () => void;
  onSelect: (voiceId: string) => void;
  onNext: () => void;
}

const VoiceSelection = ({ open, onClose, onSelect, onNext }: VoiceSelectionProps) => {
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

  const handleSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onSelect(voiceId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Escolher Voz</DialogTitle>
        </DialogHeader>

        <ProgressBar currentStep={2} totalSteps={4} />

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => handleSelect(voice.id)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all",
                  "hover:border-primary hover:shadow-glow",
                  selectedVoice === voice.id
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border bg-secondary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <span>{voice.country}</span>
                        <span>{voice.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{voice.style}</div>
                    </div>
                  </div>
                  {selectedVoice === voice.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Button
          onClick={onNext}
          disabled={!selectedVoice}
          className="w-full bg-gradient-primary hover:opacity-90 disabled:opacity-50"
        >
          Continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSelection;
