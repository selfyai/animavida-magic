importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let messaging = null;

// Listen for Firebase config from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      const firebaseConfig = event.data.config;
      
      // Initialize Firebase if not already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        messaging = firebase.messaging();
        
        console.log('Firebase initialized in service worker');

        // Set up background message handler
        messaging.onBackgroundMessage((payload) => {
          console.log('Received background message:', payload);
          
          const notificationTitle = payload.notification?.title || 'Nova notificação';
          const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/icon-512x512.png',
            badge: '/favicon.png',
            tag: payload.data?.tag || 'default',
            requireInteraction: false,
            data: payload.data
          };

          return self.registration.showNotification(notificationTitle, notificationOptions);
        });
      }
    } catch (error) {
      console.error('Error initializing Firebase in service worker:', error);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
