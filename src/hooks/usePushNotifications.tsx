import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage, isFirebaseConfigured } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [userId]);

  // Don't use push notifications if Firebase is not configured
  if (!isFirebaseConfigured() || !messaging) {
    return {
      permission: 'default' as NotificationPermission,
      fcmToken: null,
      requestPermission: async () => {
        console.warn('Firebase not configured for push notifications');
      },
    };
  }

  const requestPermission = async () => {
    if (!userId) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Register service worker for FCM
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Send Firebase config to service worker
        registration.active?.postMessage({
          type: 'FIREBASE_CONFIG',
          config: {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
          }
        });

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
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
    if (!userId) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      toast(payload.notification?.title || 'Nova notificação', {
        description: payload.notification?.body,
      });
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    permission,
    fcmToken,
    requestPermission,
  };
}
