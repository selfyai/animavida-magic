import { Home, Video, User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onCameraClick: () => void;
}

const MobileNav = ({ onCameraClick }: MobileNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-secondary/80 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-20 px-4 max-w-md mx-auto">
        <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-6 h-6" />
          <span className="text-xs">Início</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <Video className="w-6 h-6" />
          <span className="text-xs">Vídeos</span>
        </button>
        
        <button 
          onClick={onCameraClick}
          className="relative -top-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-glow hover:scale-105 transition-transform"
        >
          <Camera className="w-8 h-8 text-primary-foreground" />
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <User className="w-6 h-6" />
          <span className="text-xs">Perfil</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-current rounded-full" />
            <div className="w-1.5 h-1.5 bg-current rounded-full mx-1" />
            <div className="w-1.5 h-1.5 bg-current rounded-full" />
          </div>
          <span className="text-xs">Mais</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
