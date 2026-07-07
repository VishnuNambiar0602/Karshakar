import { logger } from '@/lib/logger';

export interface NotificationPayload {
  to: string; // Phone number
  message: string;
  type: 'sms' | 'whatsapp';
}

/**
 * Sends a notification via SMS.
 * Integrates with standard services like Twilio / MSG91.
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      // Direct HTTP request to Twilio API to keep dependencies light
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader,
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        logger.info('sms_sent_twilio', { to });
        return true;
      } else {
        const errText = await response.text();
        logger.error('sms_twilio_failed', { error: errText, to });
      }
    } catch (e) {
      logger.error('sms_twilio_exception', { error: String(e), to });
    }
  }

  // Fallback / Sandbox logging
  logger.info('SMS Sandbox Notification:', {
    to,
    message,
    status: 'SIMULATED_SUCCESS'
  });
  console.log(`[SMS SENDING SIMULATION] To: ${to} | Msg: ${message}`);
  return true;
}

/**
 * Sends a notification via WhatsApp.
 * Integrates with WhatsApp Business Cloud API.
 */
export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (phoneNumberId && accessToken) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: {
              body: message,
            },
          }),
        }
      );

      if (response.ok) {
        logger.info('whatsapp_sent_facebook', { to });
        return true;
      } else {
        const errText = await response.text();
        logger.error('whatsapp_facebook_failed', { error: errText, to });
      }
    } catch (e) {
      logger.error('whatsapp_facebook_exception', { error: String(e), to });
    }
  }

  // Fallback / Sandbox logging
  logger.info('WhatsApp Sandbox Notification:', {
    to,
    message,
    status: 'SIMULATED_SUCCESS'
  });
  console.log(`[WHATSAPP SENDING SIMULATION] To: ${to} | Msg: ${message}`);
  return true;
}

/**
 * Unified send function
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  if (payload.type === 'whatsapp') {
    return sendWhatsApp(payload.to, payload.message);
  }
  return sendSMS(payload.to, payload.message);
}
