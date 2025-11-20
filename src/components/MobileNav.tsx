import { Home, Video, User, Camera, Lightbulb } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onCameraClick?: () => void;
}

const MobileNav = ({ onCameraClick }: MobileNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleCameraClick = () => {
    if (onCameraClick) {
      onCameraClick();
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-secondary/80 backdrop-blur-lg border-t border-border pb-safe-bottom">
      <div className="flex items-center justify-around h-20 px-4 max-w-md mx-auto">
        <button 
          onClick={() => navigate('/')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive('/') ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Início</span>
        </button>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive('/dashboard') ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Video className="w-6 h-6" />
          <span className="text-xs">Recentes</span>
        </button>
        
        <button 
          onClick={handleCameraClick}
          className="relative -top-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-glow hover:scale-105 transition-transform"
        >
          <Camera className="w-8 h-8 text-primary-foreground" />
        </button>
        
        <button 
          onClick={() => navigate('/ideas')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive('/ideas') ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Lightbulb className="w-6 h-6" />
          <span className="text-xs">Ideias</span>
        </button>
        
        <button 
          onClick={() => navigate('/profile')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive('/profile') ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-xs">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
