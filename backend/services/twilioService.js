import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromSMS = process.env.TWILIO_FROM_SMS;
const fromWhatsApp = process.env.TWILIO_FROM_WHATSAPP || 'whatsapp:+14155238886'; // Twilio Sandbox WhatsApp number

let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log('[Twilio] Service successfully initialized.');
  } catch (error) {
    console.error('[Twilio] Initialization failed:', error.message);
  }
} else {
  console.warn('[Twilio] Credentials missing. Running in simulated developer sandbox mode.');
}

/**
 * Send SMS alert to target number
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - SMS content text
 */
export const sendSMS = async (to, body) => {
  if (!to) return;
  
  if (client && fromSMS) {
    try {
      await client.messages.create({
        body,
        from: fromSMS,
        to
      });
      console.log(`[Twilio] SMS successfully dispatched to ${to}`);
    } catch (err) {
      console.error(`[Twilio] SMS dispatch failed to ${to}:`, err.message);
    }
  } else {
    // Simulated print block
    console.log(`\n┌────────────────────────────────────────────────────────┐`);
    console.log(`│                 [SMS ALERT SIMULATOR]                  │`);
    console.log(`├────────────────────────────────────────────────────────┤`);
    console.log(`│ TO:      ${to.padEnd(46)}│`);
    console.log(`├────────────────────────────────────────────────────────┤`);
    const lines = body.split('\n');
    for (const line of lines) {
      console.log(`│ ${line.padEnd(54)} │`);
    }
    console.log(`└────────────────────────────────────────────────────────┘\n`);
  }
};

/**
 * Send WhatsApp alert to target number
 * @param {string} to - Recipient WhatsApp number (e.g. 'whatsapp:+123456789')
 * @param {string} body - WhatsApp body text
 */
export const sendWhatsApp = async (to, body) => {
  if (!to) return;

  // Format to standard WhatsApp URI if not already present
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  if (client) {
    try {
      await client.messages.create({
        body,
        from: fromWhatsApp,
        to: formattedTo
      });
      console.log(`[Twilio] WhatsApp alert dispatched to ${formattedTo}`);
    } catch (err) {
      console.error(`[Twilio] WhatsApp dispatch failed to ${formattedTo}:`, err.message);
    }
  } else {
    // Simulated print block
    console.log(`\n┌────────────────────────────────────────────────────────┐`);
    console.log(`│              [WHATSAPP ALERT SIMULATOR]                │`);
    console.log(`├────────────────────────────────────────────────────────┤`);
    console.log(`│ TO:      ${formattedTo.padEnd(46)}│`);
    console.log(`├────────────────────────────────────────────────────────┤`);
    const lines = body.split('\n');
    for (const line of lines) {
      console.log(`│ ${line.padEnd(54)} │`);
    }
    console.log(`└────────────────────────────────────────────────────────┘\n`);
  }
};
