import { getSupabaseClient } from '../client';
import {
  Notification,
  NotificationCanonicalChannel,
  NotificationQueuePayload,
  NotificationQueueRecord,
  NotificationStatus
} from '../../types';

export const NOTIFICATION_QUEUE_TABLE = 'notification_queue';

const PRIORITY_BY_LABEL: Record<Notification['priority'], number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
  critical: 5
};

const CHANNEL_BY_LEGACY_VALUE: Record<Notification['channel'], NotificationCanonicalChannel> = {
  system: 'in_app',
  in_app: 'in_app',
  email: 'email',
  sms: 'sms',
  whatsapp: 'sms',
  push: 'push',
  teams: 'webhook',
  slack: 'webhook',
  webhook: 'webhook'
};

const CANONICAL_STATUSES = new Set<NotificationStatus>([
  'queued',
  'processing',
  'delivered',
  'failed',
  'dead_letter'
]);

function requireNonEmpty(value: string | undefined, field: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Notification ${field} is required`);
  }

  return value;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeNotificationPriority(priority: Notification['priority']): number {
  const normalized = PRIORITY_BY_LABEL[priority];
  if (!normalized) {
    throw new Error(`Unsupported notification priority: ${String(priority)}`);
  }

  return normalized;
}

export function normalizeNotificationChannel(channel: Notification['channel']): NotificationCanonicalChannel {
  const normalized = CHANNEL_BY_LEGACY_VALUE[channel];
  if (!normalized) {
    throw new Error(`Unsupported notification channel: ${String(channel)}`);
  }

  return normalized;
}

export function normalizeNotificationStatus(status: Notification['status']): NotificationStatus {
  if (!CANONICAL_STATUSES.has(status)) {
    throw new Error(
      `Unsupported notification persistence status: ${String(status)}. ` +
      'Use queued, processing, delivered, failed, or dead_letter.'
    );
  }

  return status;
}

export function buildNotificationQueuePayload(notification: Notification): NotificationQueuePayload {
  const payload: NotificationQueuePayload = {
    module: requireNonEmpty(notification.module, 'module'),
    reference: {
      type: requireNonEmpty(notification.referenceType, 'referenceType'),
      id: requireNonEmpty(notification.referenceId, 'referenceId')
    },
    category: requireNonEmpty(notification.category, 'category'),
    subject: requireNonEmpty(notification.subject, 'subject'),
    body: requireNonEmpty(notification.body, 'body'),
    language: requireNonEmpty(notification.language, 'language')
  };

  if (notification.channel === 'whatsapp' || notification.channel === 'teams' || notification.channel === 'slack') {
    payload.legacyChannel = notification.channel;
  }

  return payload;
}

export function toNotificationQueueRow(notification: Notification): Record<string, unknown> {
  const id = requireNonEmpty(notification.id, 'id');
  const tenantId = requireNonEmpty(notification.tenantId, 'tenantId');
  const recipientUserId = requireNonEmpty(notification.recipientUserId, 'recipientUserId');
  const createdDate = notification.createdDate || new Date().toISOString();
  const channel = normalizeNotificationChannel(notification.channel);

  return {
    id,
    tenant_id: tenantId,
    recipient_user_id: recipientUserId,
    channel,
    payload: buildNotificationQueuePayload(notification),
    // The notification id is the stable idempotency identity for this write.
    idempotency_key: id,
    priority: normalizeNotificationPriority(notification.priority),
    status: normalizeNotificationStatus(notification.status),
    retry_count: Math.max(0, notification.retryCount || 0),
    available_at: notification.scheduledDate || createdDate,
    ...(isUuid(notification.createdBy) ? { created_by: notification.createdBy } : {})
  };
}

function isPayload(value: unknown): value is NotificationQueuePayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<NotificationQueuePayload>;
  return Boolean(
    typeof payload.module === 'string' &&
    payload.reference &&
    typeof payload.reference.type === 'string' &&
    typeof payload.reference.id === 'string' &&
    typeof payload.category === 'string' &&
    typeof payload.subject === 'string' &&
    typeof payload.body === 'string' &&
    typeof payload.language === 'string'
  );
}

export function fromNotificationQueueRow(row: Record<string, any>): NotificationQueueRecord {
  if (!isPayload(row.payload)) {
    throw new Error('Canonical notification payload is missing or invalid');
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    recipientUserId: row.recipient_user_id,
    channel: row.channel,
    payload: row.payload,
    priority: row.priority,
    status: row.status,
    retryCount: row.retry_count,
    createdAt: row.created_at
  };
}

export class NotificationRepository {
  public async create(notification: Notification): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('No Supabase client available');

    const row = toNotificationQueueRow(notification);
    const { error } = await supabase.from(NOTIFICATION_QUEUE_TABLE).insert([row]);
    if (error) {
      throw error;
    }
  }

  public async getInbox(tenantId: string, recipientUserId: string): Promise<NotificationQueueRecord[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('No Supabase client available');

    const { data, error } = await supabase
      .from(NOTIFICATION_QUEUE_TABLE)
      .select('id, tenant_id, recipient_user_id, channel, payload, priority, status, retry_count, created_at')
      .eq('tenant_id', requireNonEmpty(tenantId, 'tenantId'))
      .eq('recipient_user_id', requireNonEmpty(recipientUserId, 'recipientUserId'))
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(row => fromNotificationQueueRow(row));
  }
}
