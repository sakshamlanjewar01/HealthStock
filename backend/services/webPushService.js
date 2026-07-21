import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@trulicare.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('[WebPush] VAPID keys loaded successfully.');
} else {
  console.warn('[WebPush] VAPID keys not configured in backend/.env. Push notifications will be simulated.');
}

/**
 * Send web push notification to a subscribed client device
 * @param {Object} subscription - Browser subscription object
 * @param {Object} payload - Notification payload (title, body, url)
 * @returns {Promise<boolean>} - False if subscription is invalid/expired and should be removed
 */
export const sendPushNotification = async (subscription, payload) => {
  if (vapidKeys.publicKey && vapidKeys.privateKey) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log(`[WebPush] Push notification sent to: ${subscription.endpoint.substring(0, 45)}...`);
      return true;
    } catch (error) {
      console.error('[WebPush] Error sending push notification:', error);
      // 410 Gone or 404 Not Found indicates subscription has expired or been revoked
      if (error.statusCode === 410 || error.statusCode === 404) {
        return false;
      }
      return true;
    }
  } else {
    // Simulated Dispatch fallback for development
    console.log(`\n┌────────────────────────────────────────────────────────┐`);
    console.log(`│             [PUSH NOTIFICATION SIMULATOR]              │`);
    console.log(`├────────────────────────────────────────────────────────┤`);
    console.log(`│ ENDPOINT: ${subscription.endpoint.substring(0, 45).padEnd(45)} │`);
    console.log(`│ TITLE:    ${payload.title.substring(0, 45).padEnd(45)} │`);
    console.log(`│ BODY:     ${payload.body.substring(0, 45).padEnd(45)} │`);
    console.log(`└────────────────────────────────────────────────────────┘\n`);
    return true;
  }
};
