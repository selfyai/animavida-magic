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
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adalberto", country: "🇧🇷", style: "Voz de Geladeira Brastemp" },
  { id: "nbk2esDn4RRk4cVDdoiE", name: "Aline", country: "🇧🇷", style: "Garganta de Chaleira da Vovó" },
  { id: "ZF6FPAbjXT4488VcRRnw", name: "Amélia", country: "🇧🇷", style: "Risada de Pomba da Praça" },
  { id: "9EU0h6CVtEDS6vriwwq5", name: "Andréa", country: "🇧🇷", style: "Língua Turbo de Feira" },
  { id: "ZkXXWlhJO3CtSXof2ujN", name: "Ana Vitória", country: "🇧🇷", style: "220V do Paraguai" },
  { id: "BY77WcifAQZkoI7EftFd", name: "Vanessa", country: "🇧🇷", style: "Ventinho de Ventilador Mondial" },
  { id: "qNkzaJoHLLdpvgh5tISm", name: "Bruno", country: "🇧🇷", style: "Estoura-Tímpano do Sertão" },
  { id: "txtf1EDouKke753vN8SL", name: "Camila", country: "🇧🇷", style: "Gargalo de Garrafa PET" },
  { id: "IHngRooVccHyPqB4uQkG", name: "Clemente", country: "🇧🇷", style: "Voz de Pudim Queimado" },
  { id: "AnvlJBAqSLDzEevYr9Ap", name: "Emanuela", country: "🇧🇷", style: "Barulho de Submarino de Isopor" },
  { id: "BZc8d1MPTdZkyGbE9Sin", name: "Francisca", country: "🇧🇷", style: "Grito de Macarronada" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "Jorge", country: "🇧🇷", style: "Trovão do Interior" },
  { id: "fzDFBB4mgvMlL36gPXcz", name: "Geovani", country: "🇧🇷", style: "Ronco de Moto CG Tuning" },
  { id: "i4CzbCVWoqvD0P1QJCUL", name: "Íris", country: "🇧🇷", style: "Estalo de Fio Desencapado" },
  { id: "NOpBlnGInO9m6vDvFkFC", name: "João", country: "🇧🇷", style: "Ventilador de Parede" },
  { id: "gAMZphRyrWJnLMDnom6H", name: "Kelvin", country: "🇧🇷", style: "Motor de Fusca 78 Falante" },
  { id: "rCuVrCHOUMY3OwyJBJym", name: "Mila", country: "🇧🇷", style: "Panela de Pressão Cantante" },
  { id: "LT7npgnEogysurF7U8GR", name: "Rosana", country: "🇧🇷", style: "Chá de Camomila Borbulhante" },
  { id: "ZRwrL4id6j1HPGFkeCzO", name: "Samuel", country: "🇧🇷", style: "Rádio AM Pirata" },
  { id: "LtPsVjX1k0Kl4StEMZPK", name: "Sofia", country: "🇧🇷", style: "Sussurro de Neblina do Brejo" },
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
