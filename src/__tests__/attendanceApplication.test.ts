import { describe, expect, it } from 'vitest';
import { AttendanceApplicationService } from '../modules/student-attendance/application/AttendanceApplicationService';
import { AttendanceDuplicateError, AttendanceLockedError, AttendancePermissionError, AttendanceValidationError } from '../modules/student-attendance/domain/errors';
import type { AttendanceRecord, AttendanceSession, TrustedAttendanceContext } from '../modules/student-attendance/domain/types';
import type { AttendanceDependencies, AttendanceRepository, AttendanceTransaction } from '../modules/student-attendance/ports/attendance-ports';

const context: TrustedAttendanceContext = {
  tenantId: 'tenant-a', schoolId: 'school-a', branchId: 'branch-a', academicYearId: 'year-a', termId: 'term-a', userId: 'user-a', role: 'teacher'
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class FakeRepository implements AttendanceRepository {
  sessions = new Map<string, AttendanceSession>();
  records = new Map<string, AttendanceRecord>();
  eligible = new Set(['student-a:enrollment-a']);
  sequence = 0;

  async findSession(_: TrustedAttendanceContext, id: string): Promise<AttendanceSession | null> { return this.sessions.get(id) || null; }
  async listSessions(): Promise<AttendanceSession[]> { return [...this.sessions.values()]; }
  async createSession(ctx: TrustedAttendanceContext, input: any): Promise<AttendanceSession> {
    const now = '2026-08-11T00:00:00.000Z';
    const session: AttendanceSession = { id: `session-${++this.sequence}`, tenantId: ctx.tenantId, schoolId: ctx.schoolId, branchId: ctx.branchId, academicYearId: ctx.academicYearId, termId: ctx.termId, classId: input.classId, sectionId: input.sectionId, attendanceDate: input.attendanceDate, periodId: input.periodId, status: 'open', version: 1, createdAt: now, createdBy: ctx.userId, updatedAt: now, updatedBy: ctx.userId, requestId: input.requestId, correlationId: input.correlationId };
    this.sessions.set(session.id, session); return session;
  }
  async lockSession(_: TrustedAttendanceContext, id: string, expectedVersion: number): Promise<AttendanceSession> {
    const session = this.sessions.get(id)!; if (session.version !== expectedVersion) throw new Error('version');
    const locked = { ...session, status: 'locked' as const, version: session.version + 1 }; this.sessions.set(id, locked); return locked;
  }
  async findRecord(_: TrustedAttendanceContext, sessionId: string, studentId: string): Promise<AttendanceRecord | null> { return [...this.records.values()].find(r => r.attendanceSessionId === sessionId && r.studentId === studentId) || null; }
  async findRecordById(_: TrustedAttendanceContext, id: string): Promise<AttendanceRecord | null> { return this.records.get(id) || null; }
  async findRecordByIdempotencyKey(_: TrustedAttendanceContext, key: string): Promise<AttendanceRecord | null> { return [...this.records.values()].find(r => r.requestId === key) || null; }
  async createRecord(ctx: TrustedAttendanceContext, input: any, session: AttendanceSession): Promise<AttendanceRecord> {
    const now = '2026-08-11T00:00:00.000Z'; const record: AttendanceRecord = { id: `record-${++this.sequence}`, tenantId: ctx.tenantId, schoolId: ctx.schoolId, branchId: ctx.branchId, attendanceSessionId: session.id, studentId: input.studentId, enrollmentId: input.enrollmentId, status: input.status, recordedAt: now, recordedBy: ctx.userId, version: 1, createdAt: now, createdBy: ctx.userId, updatedAt: now, updatedBy: ctx.userId, requestId: input.idempotencyKey, correlationId: input.correlationId };
    this.records.set(record.id, record); return record;
  }
  async correctRecord(_: TrustedAttendanceContext, input: any, record: AttendanceRecord): Promise<AttendanceRecord> {
    const corrected = { ...record, status: input.status, correctedAt: '2026-08-11T00:00:00.000Z', correctedBy: context.userId, correctionReason: input.reason, version: record.version + 1, updatedAt: '2026-08-11T00:00:00.000Z', requestId: input.requestId };
    this.records.set(record.id, corrected); return corrected;
  }
  async listSessionRecords(_: TrustedAttendanceContext, sessionId: string): Promise<AttendanceRecord[]> { return [...this.records.values()].filter(r => r.attendanceSessionId === sessionId); }
  async listStudentRecords(_: TrustedAttendanceContext, studentId: string): Promise<AttendanceRecord[]> { return [...this.records.values()].filter(r => r.studentId === studentId); }
}

function dependencies(repo = new FakeRepository(), options: { deny?: string; failAudit?: boolean } = {}): AttendanceDependencies & { repo: FakeRepository; audits: any[]; outboxEvents: any[] } {
  const audits: any[] = []; const outboxEvents: any[] = [];
  const deps: AttendanceDependencies & { repo: FakeRepository; audits: any[]; outboxEvents: any[] } = {
    repo, audits, outboxEvents, repository: repo,
    eligibility: { assertEligible: async (_ctx, studentId, enrollmentId) => { if (!repo.eligible.has(`${studentId}:${enrollmentId}`)) throw new AttendanceValidationError('Enrollment is not eligible for this session'); } },
    permissions: { assert: async (_ctx, permission) => { if (options.deny === permission) throw new Error('denied'); } },
    transactions: { run: async (_operation, callback) => { const sessions = clone([...repo.sessions.entries()]); const records = clone([...repo.records.entries()]); try { return await callback({ id: 'tx-1' }); } catch (error) { repo.sessions = new Map(sessions); repo.records = new Map(records); throw error; } } },
    audit: { append: async (_tx, event) => { if (options.failAudit) throw new Error('audit failure'); audits.push(event); } },
    outbox: { enqueue: async (_tx, event) => { outboxEvents.push(event); } },
  };
  return deps;
}

async function openSession(service: AttendanceApplicationService): Promise<AttendanceSession> {
  return service.createSession(context, { classId: 'class-a', sectionId: 'section-a', attendanceDate: '2026-08-11', periodId: 'period-1', requestId: 'request-session', correlationId: 'correlation-session' });
}

describe('AttendanceApplicationService', () => {
  it('requires complete trusted context', async () => {
    const service = new AttendanceApplicationService(dependencies());
    await expect(service.listSessions({ ...context, tenantId: '' })).rejects.toMatchObject({ code: 'ATTENDANCE_CONTEXT_REQUIRED' });
  });

  it('fails closed when the permission dependency denies access', async () => {
    const deps = dependencies(new FakeRepository(), { deny: 'Attendance.Session.Create' });
    await expect(openSession(new AttendanceApplicationService(deps))).rejects.toBeInstanceOf(AttendancePermissionError);
  });

  it('creates a trusted open session', async () => {
    const deps = dependencies(); const session = await openSession(new AttendanceApplicationService(deps));
    expect(session.status).toBe('open'); expect(session.tenantId).toBe(context.tenantId); expect(deps.audits[0].operation).toBe('session.created');
  });

  it('rejects an invalid enrollment before creating a record', async () => {
    const deps = dependencies(); const service = new AttendanceApplicationService(deps); const session = await openSession(service);
    await expect(service.recordAttendance(context, session.id, { studentId: 'student-b', enrollmentId: 'enrollment-b', status: 'present', idempotencyKey: 'key-b', requestId: 'request-b', correlationId: 'correlation-b' })).rejects.toMatchObject({ code: 'ATTENDANCE_VALIDATION_ERROR' });
    expect(deps.repo.records.size).toBe(0);
  });

  it('records valid present, absent, late, and excused states', async () => {
    const deps = dependencies(); const service = new AttendanceApplicationService(deps); const session = await openSession(service);
    for (const [index, status] of (['present', 'absent', 'late', 'excused'] as const).entries()) {
      deps.repo.eligible.add(`student-${index}:enrollment-${index}`);
      const record = await service.recordAttendance(context, session.id, { studentId: `student-${index}`, enrollmentId: `enrollment-${index}`, status, idempotencyKey: `key-${index}`, requestId: `request-${index}`, correlationId: `correlation-${index}` });
      expect(record.status).toBe(status);
    }
  });

  it('rejects duplicate student/session records and accepts an idempotent retry', async () => {
    const deps = dependencies(); const service = new AttendanceApplicationService(deps); const session = await openSession(service);
    const input = { studentId: 'student-a', enrollmentId: 'enrollment-a', status: 'present' as const, idempotencyKey: 'key-a', requestId: 'key-a', correlationId: 'correlation-a' };
    const first = await service.recordAttendance(context, session.id, input); const retry = await service.recordAttendance(context, session.id, input);
    expect(retry.id).toBe(first.id);
    await expect(service.recordAttendance(context, session.id, { ...input, idempotencyKey: 'key-other', requestId: 'key-other' })).rejects.toBeInstanceOf(AttendanceDuplicateError);
  });

  it('locks a session and rejects later record writes', async () => {
    const deps = dependencies(); const service = new AttendanceApplicationService(deps); const session = await openSession(service);
    const locked = await service.lockSession(context, session.id, 1, 'lock-request', 'lock-correlation'); expect(locked.status).toBe('locked');
    await expect(service.recordAttendance(context, session.id, { studentId: 'student-a', enrollmentId: 'enrollment-a', status: 'present', idempotencyKey: 'locked-key', requestId: 'locked-request', correlationId: 'locked-correlation' })).rejects.toBeInstanceOf(AttendanceLockedError);
  });

  it('requires correction reason and records old/new audit metadata', async () => {
    const deps = dependencies(); const service = new AttendanceApplicationService(deps); const session = await openSession(service);
    const record = await service.recordAttendance(context, session.id, { studentId: 'student-a', enrollmentId: 'enrollment-a', status: 'absent', idempotencyKey: 'correction-create', requestId: 'correction-create', correlationId: 'correction-correlation' });
    const corrected = await service.correctAttendance(context, { recordId: record.id, expectedVersion: 1, status: 'present', reason: 'Verified by class register', idempotencyKey: 'correction-key', requestId: 'correction-request', correlationId: 'correction-correlation' });
    expect(corrected.status).toBe('present'); expect(deps.audits.at(-1)).toMatchObject({ operation: 'record.corrected', oldStatus: 'absent', newStatus: 'present', reason: 'Verified by class register' });
  });

  it('rolls back the record when audit fails', async () => {
    const deps = dependencies(new FakeRepository(), { failAudit: true }); const service = new AttendanceApplicationService(deps); const sessionInput = { classId: 'class-a', sectionId: 'section-a', attendanceDate: '2026-08-11', periodId: 'period-1', requestId: 'request-session', correlationId: 'correlation-session' };
    await expect(service.createSession(context, sessionInput)).rejects.toThrow('audit failure');
    expect(deps.repo.sessions.size).toBe(0);
  });
});
