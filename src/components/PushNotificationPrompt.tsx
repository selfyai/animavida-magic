import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

interface PushNotificationPromptProps {
  userId: string | undefined;
}

export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const { permission, requestPermission } = usePushNotifications(userId);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check if user already dismissed the prompt
    const hasBeenDismissed = localStorage.getItem('push-notification-prompt-dismissed');
    if (hasBeenDismissed) {
      setDismissed(true);
      return;
    }

    // Only show if permission is default (not granted or denied)
    if (permission === 'default') {
      // Show after 3 seconds
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [userId, permission]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('push-notification-prompt-dismissed', 'true');
  };

  const handleAccept = async () => {
    await requestPermission();
    setShow(false);
  };

  if (!show || dismissed || !userId || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Ativar Notificações?</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Receba novidades e atualizações
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-muted-foreground">
            Fique por dentro de promoções exclusivas, novos recursos e atualizações importantes.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              className="flex-1"
              size="sm"
            >
              Ativar Notificações
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
            >
              Agora não
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
