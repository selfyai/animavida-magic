import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage, isFirebaseConfigured, initializeFirebaseFromDB } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    // Initialize Firebase from DB and check permission
    const init = async () => {
      await initializeFirebaseFromDB();
      setFirebaseReady(isFirebaseConfigured());
      
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    
    init();
  }, [userId]);

  const requestPermission = async () => {
    if (!firebaseReady || !messaging) {
      console.warn('Firebase not configured for push notifications');
      toast.error('Firebase não está configurado. Configure nas configurações do admin.');
      return;
    }
    if (!userId) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    try {
      // Get Firebase config from database
      const { data: configData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'firebase_config')
        .maybeSingle();

      if (!configData?.value) {
        toast.error('Firebase não está configurado');
        return;
      }

      const config = configData.value as any;
      
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Register service worker for FCM
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Send Firebase config to service worker
        registration.active?.postMessage({
          type: 'FIREBASE_CONFIG',
          config: {
            apiKey: config.apiKey,
            projectId: config.projectId,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
          }
        });

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: config.vapidKey || undefined,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log('FCM Token obtained:', token);
          setFcmToken(token);

          // Save token to Supabase
          const { error } = await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', userId);

          if (error) {
            console.error('Error saving push token:', error);
            toast.error('Erro ao salvar token de notificação');
          } else {
            toast.success('Notificações ativadas com sucesso!');
          }
        }
      } else {
        toast.error('Permissão negada para notificações');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erro ao solicitar permissão de notificação');
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!userId || !firebaseReady || !messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      toast(payload.notification?.title || 'Nova notificação', {
        description: payload.notification?.body,
      });
    });

    return () => unsubscribe();
  }, [userId, firebaseReady]);

  return {
    permission,
    fcmToken,
    requestPermission,
  };
}
