/**
 * Enterprise Notification Framework
 */

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
export type RecipientType = 'parent' | 'teacher' | 'student' | 'admin' | 'emergency';

export interface NotificationTemplate {
  id: string;
  name: string;
  channels: NotificationChannel[];
  content: string;
}

export interface NotificationRequest {
  id: string;
  recipientUserId: string;
  recipientType: RecipientType;
  templateId: string;
  channel: NotificationChannel;
  data: Record<string, any>;
}

export interface DeliveryRecord {
  id: string;
  requestId: string;
  status: 'pending' | 'delivered' | 'failed';
  retries: number;
  lastAttempt: string;
}
