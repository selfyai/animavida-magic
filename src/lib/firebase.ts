import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Check if Firebase config is available
const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Only initialize if config is available
if (isFirebaseConfigured()) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export { messaging, getToken, onMessage, isFirebaseConfigured };
