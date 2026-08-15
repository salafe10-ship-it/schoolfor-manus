import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));

import {
  NotificationRepository,
  buildNotificationQueuePayload,
  fromNotificationQueueRow,
  normalizeNotificationChannel,
  normalizeNotificationPriority,
  normalizeNotificationStatus,
  toNotificationQueueRow
} from '../database/repositories/NotificationRepository';

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notification-1',
    schoolId: 'school-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    recipientUserId: 'recipient-1',
    module: 'students',
    referenceType: 'student',
    referenceId: 'student-1',
    priority: 'normal' as const,
    category: 'status_change',
    subject: 'Student status changed',
    body: 'The student status was changed.',
    channel: 'email' as const,
    language: 'ar',
    createdBy: 'not-a-uuid',
    createdDate: '2026-08-13T10:00:00.000Z',
    status: 'queued' as const,
    retryCount: 0,
    ...overrides
  };
}

function createInsertClient(result: { error: unknown }) {
  const insert = vi.fn().mockResolvedValue(result);
  const from = vi.fn(() => ({ insert }));
  mocks.getSupabaseClient.mockReturnValue({ from });
  return { from, insert };
}

function createReadClient(result: { data: unknown[] | null; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result);
  const is = vi.fn(() => ({ order }));
  const eqRecipient = vi.fn(() => ({ is }));
  const eqTenant = vi.fn(() => ({ eq: eqRecipient }));
  const select = vi.fn(() => ({ eq: eqTenant }));
  const from = vi.fn(() => ({ select }));
  mocks.getSupabaseClient.mockReturnValue({ from });
  return { from, select, eqTenant, eqRecipient, is, order };
}

describe('DB-001-NONACC-019 canonical notification parity', () => {
  beforeEach(() => mocks.getSupabaseClient.mockReset());

  it('creates only in notification_queue and succeeds on a canonical response', async () => {
    const { from, insert } = createInsertClient({ error: null });

    await new NotificationRepository().create(makeNotification());

    expect(from).toHaveBeenCalledWith('notification_queue');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0][0]).toMatchObject({
      tenant_id: 'tenant-1',
      recipient_user_id: 'recipient-1',
      idempotency_key: 'notification-1',
      priority: 2,
      status: 'queued'
    });
  });

  it('propagates a Supabase insert error instead of reporting success', async () => {
    const error = new Error('insert failed');
    createInsertClient({ error });

    await expect(new NotificationRepository().create(makeNotification())).rejects.toBe(error);
  });

  it('reads the canonical notification inbox', async () => {
    const row = {
      id: 'notification-1', tenant_id: 'tenant-1', recipient_user_id: 'recipient-1',
      channel: 'in_app', payload: buildNotificationQueuePayload(makeNotification()),
      priority: 2, status: 'queued', retry_count: 0, created_at: '2026-08-13T10:00:00.000Z'
    };
    const { from, select } = createReadClient({ data: [row], error: null });

    const result = await new NotificationRepository().getInbox('tenant-1', 'recipient-1');

    expect(from).toHaveBeenCalledWith('notification_queue');
    expect(select).toHaveBeenCalledWith(expect.stringContaining('recipient_user_id'));
    expect(result).toEqual([fromNotificationQueueRow(row)]);
  });

  it('enforces tenant isolation in the canonical query', async () => {
    const { eqTenant } = createReadClient({ data: [], error: null });
    await new NotificationRepository().getInbox('tenant-a', 'recipient-a');
    expect(eqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-a');
  });

  it('enforces recipient isolation in the canonical query', async () => {
    const { eqRecipient } = createReadClient({ data: [], error: null });
    await new NotificationRepository().getInbox('tenant-a', 'recipient-a');
    expect(eqRecipient).toHaveBeenCalledWith('recipient_user_id', 'recipient-a');
  });

  it('keeps a canonical empty inbox empty', async () => {
    createReadClient({ data: [], error: null });
    await expect(new NotificationRepository().getInbox('tenant-a', 'recipient-a')).resolves.toEqual([]);
  });

  it('propagates a canonical read failure', async () => {
    const error = new Error('read failed');
    createReadClient({ data: null, error });
    await expect(new NotificationRepository().getInbox('tenant-a', 'recipient-a')).rejects.toBe(error);
  });

  it('does not import or read FallbackStorage', async () => {
    const source = await import('node:fs').then(fs => fs.readFileSync('src/database/repositories/NotificationRepository.ts', 'utf8'));
    expect(source).not.toContain('FallbackStorage');
    expect(source).not.toContain("from('notifications')");
  });

  it('does not retry a failed canonical insert', async () => {
    const { insert } = createInsertClient({ error: new Error('failure') });
    await expect(new NotificationRepository().create(makeNotification())).rejects.toThrow('failure');
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('maps every approved priority exactly', () => {
    expect(['low', 'normal', 'high', 'urgent', 'critical'].map(value => normalizeNotificationPriority(value as any)))
      .toEqual([1, 2, 3, 4, 5]);
  });

  it('normalizes the approved and legacy channels without losing legacy identity', () => {
    expect(normalizeNotificationChannel('email')).toBe('email');
    expect(normalizeNotificationChannel('system')).toBe('in_app');
    expect(normalizeNotificationChannel('whatsapp')).toBe('sms');
    expect(normalizeNotificationChannel('teams')).toBe('webhook');
    expect(normalizeNotificationChannel('slack')).toBe('webhook');
  });

  it('round-trips the canonical payload without inventing database columns', () => {
    const payload = buildNotificationQueuePayload(makeNotification({ channel: 'teams' }));
    expect(payload).toEqual({
      module: 'students',
      reference: { type: 'student', id: 'student-1' },
      category: 'status_change',
      subject: 'Student status changed',
      body: 'The student status was changed.',
      language: 'ar',
      legacyChannel: 'teams'
    });
  });

  it('accepts only canonical persistence statuses', () => {
    expect(normalizeNotificationStatus('queued')).toBe('queued');
    expect(normalizeNotificationStatus('processing')).toBe('processing');
    expect(normalizeNotificationStatus('delivered')).toBe('delivered');
    expect(normalizeNotificationStatus('failed')).toBe('failed');
    expect(normalizeNotificationStatus('dead_letter')).toBe('dead_letter');
  });

  it('does not convert read or archived into delivery status', () => {
    expect(() => normalizeNotificationStatus('read' as any)).toThrow();
    expect(() => normalizeNotificationStatus('archived' as any)).toThrow();
    expect(() => normalizeNotificationStatus('sent' as any)).toThrow();
  });

  it('keeps the existing NotificationService consumer on the repository boundary', async () => {
    const source = await import('node:fs').then(fs => fs.readFileSync('src/database/services/NotificationService.ts', 'utf8'));
    expect(source).toContain("import { NotificationRepository } from '../repositories/NotificationRepository'");
    expect(source).toContain("status: 'queued'");
  });
});
