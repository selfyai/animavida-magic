import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformDetection(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const detectAndUpdatePlatform = async () => {
      try {
        // Detect platform
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        let platform = 'web';
        let isPWA = false;

        // Check if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone === true) {
          isPWA = true;
        }

        // Detect iOS
        if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
          platform = 'ios';
        }
        // Detect Android
        else if (/android/i.test(userAgent)) {
          platform = 'android';
        }

        console.log('Platform detected:', { platform, isPWA });

        // Check current profile data
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('platform, pwa_installed')
          .eq('id', userId)
          .maybeSingle();

        // Only update if something changed
        if (!currentProfile || 
            currentProfile.platform !== platform || 
            currentProfile.pwa_installed !== isPWA) {
          
          const { error } = await supabase
            .from('profiles')
            .update({
              platform,
              pwa_installed: isPWA,
              last_platform_update: new Date().toISOString(),
            })
            .eq('id', userId);

          if (error) {
            console.error('Error updating platform:', error);
          } else {
            console.log('Platform updated successfully');
          }
        }
      } catch (error) {
        console.error('Error detecting platform:', error);
      }
    };

    // Run detection
    detectAndUpdatePlatform();

    // Re-check when display mode changes (PWA install/uninstall)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      detectAndUpdatePlatform();
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [userId]);
}