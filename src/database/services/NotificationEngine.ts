
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationCategory = 'doc_expired' | 'fee_due' | 'transport' | 'status_change';
export type NotificationChannel = 'ui' | 'email' | 'sms' | 'whatsapp';

export interface NotificationPayload {
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}

export const NotificationEngine = {
  async notify(payload: NotificationPayload, uiCallback: (msg: string, type: NotificationType) => void) {
    const { message, type, category, channels = ['ui'], metadata } = payload;

    // 1. UI Notification (Immediate)
    if (channels.includes('ui')) {
      uiCallback(message, type);
    }

    // 2. Integration hooks (Future-proofing)
    if (channels.includes('email')) {
      console.log(`[Email] Sending: ${message}`);
    }
    
    if (channels.includes('sms')) {
      console.log(`[SMS] Sending: ${message}`);
    }

    if (channels.includes('whatsapp')) {
      console.log(`[WhatsApp] Sending: ${message}`);
    }

    // 3. Log the action (Audit Logging)
    console.log(`[AuditLog] Notification sent: [${type}] [${category || 'general'}] ${message}`);
  }
};
