import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let isConfigured = false;

// Initialize Firebase from database config
async function initializeFirebaseFromDB() {
  if (isConfigured) return;

  try {
    // Load config from database
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'firebase_config')
      .maybeSingle();

    if (!data?.value) {
      console.warn('Firebase not configured in database');
      return;
    }

    const config = data.value as any;
    
    // Check if all required fields are present
    if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
      console.warn('Incomplete Firebase configuration');
      return;
    }

    const firebaseConfig = {
      apiKey: config.apiKey,
      projectId: config.projectId,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    };

    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    isConfigured = true;
    console.log('Firebase initialized successfully from database');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

// Auto-initialize when module is imported
initializeFirebaseFromDB();

const isFirebaseConfigured = () => isConfigured;

export { messaging, getToken, onMessage, isFirebaseConfigured, initializeFirebaseFromDB };
