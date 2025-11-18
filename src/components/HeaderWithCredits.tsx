import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreditsPurchaseDialog } from '@/components/CreditsPurchaseDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Video, LogOut, Shield, Home } from 'lucide-react';

export function HeaderWithCredits() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  
  const isAdminPage = location.pathname === '/admin';

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    console.log('HeaderWithCredits - isAdmin:', isAdmin);
    console.log('HeaderWithCredits - user:', user?.email);
  }, [isAdmin, user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();
    
    setProfile(data);
  };

  if (!user) return null;

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Video AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowCreditDialog(true)}
            >
              <Coins className="h-4 w-4" />
              {profile?.credits || 0} créditos
            </Button>
            
            {/* Debug: sempre mostra estado do admin */}
            <div className="text-xs text-muted-foreground">
              isAdmin: {isAdmin ? 'true' : 'false'}
            </div>
            
            {isAdmin && !isAdminPage && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Navegando para /admin');
                  navigate('/admin');
                }}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
            
            {isAdmin && isAdminPage && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Navegando para /dashboard');
                  navigate('/dashboard');
                }}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            )}
            
            <Avatar className="cursor-pointer" onClick={signOut}>
              <AvatarFallback>
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <CreditsPurchaseDialog 
        open={showCreditDialog} 
        onOpenChange={setShowCreditDialog}
        onPurchaseComplete={loadProfile}
      />
    </>
  );
}
