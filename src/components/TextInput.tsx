import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Lightbulb } from "lucide-react";
import ProgressBar from "./ProgressBar";

interface TextInputProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  onNext: () => void;
}

const TextInput = ({ open, onClose, onSubmit, onNext }: TextInputProps) => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount >= 7 && wordCount <= 11;

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(text);
      onNext();
    }
  };

  const handleIdeasClick = () => {
    onClose();
    navigate("/ideas");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Texto da Animação</DialogTitle>
        </DialogHeader>

        <ProgressBar currentStep={3} totalSteps={4} />

        <div className="space-y-4">
          <Button
            onClick={handleIdeasClick}
            variant="outline"
            className="w-full border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Ver Sugestões de Ideias
          </Button>
          <div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o texto que o personagem vai falar..."
              className="min-h-[120px] bg-input border-border text-foreground resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-sm ${
                  isValid ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {wordCount} palavras
              </span>
              <span className="text-xs text-muted-foreground">7-11 palavras</span>
            </div>
          </div>

          {!isValid && wordCount > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">
                {wordCount < 7
                  ? "Adicione mais palavras para um vídeo melhor (mínimo 7 palavras)."
                  : "Texto muito longo. Reduza para até 11 palavras."}
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-gradient-primary hover:opacity-90 disabled:opacity-50"
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextInput;
