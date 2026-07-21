// Utility helpers to handle browser push subscription registration

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerPush = async (backendUrl, vapidPublicKey) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser.');
    return null;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully with scope:', registration.scope);

    // 2. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied by user.');
      return null;
    }

    // 3. Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      if (!vapidPublicKey) {
        console.warn('Cannot subscribe: VAPID public key not provided.');
        return null;
      }
      
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // 4. Send subscription details to backend
    const response = await fetch(`${backendUrl}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subscription }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to register subscription on the backend.');
    }

    console.log('Successfully registered Web Push on server.');
    return subscription;
  } catch (error) {
    console.error('Error during push subscription registration:', error);
    return null;
  }
};

export const unsubscribePush = async (backendUrl) => {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Use a race with a timeout — serviceWorker.ready hangs forever if no SW is installed
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 2000))
    ]);

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await fetch(`${backendUrl}/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
        credentials: 'include'
      });
      console.log('Successfully unsubscribed from Web Push on server.');
    }
  } catch (error) {
    // Silently ignore — no active service worker means nothing to unsubscribe
    if (!error.message?.includes('SW timeout')) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }
};
