import {
  AttendanceConcurrencyError,
  AttendanceContextError,
  AttendanceDuplicateError,
  AttendanceLockedError,
  AttendanceNotFoundError,
  AttendancePermissionError,
  AttendanceValidationError,
} from '../domain/errors';
import type {
  AttendanceRecord,
  AttendanceSession,
  CorrectAttendanceInput,
  CreateAttendanceSessionInput,
  RecordAttendanceInput,
  TrustedAttendanceContext,
} from '../domain/types';
import type { AttendanceDependencies } from '../ports/attendance-ports';

export const ATTENDANCE_PERMISSIONS = {
  SESSION_VIEW: 'Attendance.Session.View',
  SESSION_CREATE: 'Attendance.Session.Create',
  RECORD_VIEW: 'Attendance.Record.View',
  RECORD_CREATE: 'Attendance.Record.Create',
  RECORD_BULK_CREATE: 'Attendance.Record.BulkCreate',
  RECORD_CORRECT: 'Attendance.Record.Correct',
  SESSION_LOCK: 'Attendance.Session.Lock',
  REPORT_VIEW: 'Attendance.Report.View',
} as const;

function assertContext(context: TrustedAttendanceContext): void {
  const fields: Array<keyof TrustedAttendanceContext> = ['tenantId', 'schoolId', 'branchId', 'academicYearId', 'termId', 'userId', 'role'];
  if (fields.some(field => typeof context[field] !== 'string' || context[field].trim() === '')) {
    throw new AttendanceContextError();
  }
}

function assertDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new AttendanceValidationError('Attendance date must be an ISO calendar date');
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim() === '') throw new AttendanceValidationError(`${field} is required`);
}

function assertStatus(status: RecordAttendanceInput['status']): void {
  if (!['present', 'absent', 'late', 'excused'].includes(status)) throw new AttendanceValidationError('Unsupported attendance status');
}

function requirePermission(result: void | Promise<void>, permission: string): Promise<void> {
  return Promise.resolve(result).catch(() => { throw new AttendancePermissionError(permission); });
}

export class AttendanceApplicationService {
  constructor(private readonly dependencies: AttendanceDependencies) {}

  async createSession(context: TrustedAttendanceContext, input: CreateAttendanceSessionInput): Promise<AttendanceSession> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.SESSION_CREATE), ATTENDANCE_PERMISSIONS.SESSION_CREATE);
    assertNonEmpty(input.classId, 'classId');
    assertNonEmpty(input.sectionId, 'sectionId');
    assertNonEmpty(input.periodId, 'periodId');
    assertNonEmpty(input.requestId, 'requestId');
    assertNonEmpty(input.correlationId, 'correlationId');
    assertDate(input.attendanceDate);

    return this.dependencies.transactions.run('attendance.session.create', async transaction => {
      const session = await this.dependencies.repository.createSession(context, input, transaction);
      await this.dependencies.audit.append(transaction, {
        operation: 'session.created', entityId: session.id, actorId: context.userId,
        tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId,
        requestId: input.requestId, correlationId: input.correlationId,
      });
      await this.dependencies.outbox.enqueue(transaction, {
        eventType: 'AttendanceSessionCreated', aggregateType: 'attendance_session', aggregateId: session.id,
        idempotencyKey: `attendance-session:${session.id}`, tenantId: context.tenantId, schoolId: context.schoolId,
        branchId: context.branchId, requestId: input.requestId, correlationId: input.correlationId,
      });
      return session;
    });
  }

  async listSessions(context: TrustedAttendanceContext): Promise<AttendanceSession[]> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.SESSION_VIEW), ATTENDANCE_PERMISSIONS.SESSION_VIEW);
    return this.dependencies.repository.listSessions(context);
  }

  async getSession(context: TrustedAttendanceContext, sessionId: string): Promise<AttendanceSession> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.SESSION_VIEW), ATTENDANCE_PERMISSIONS.SESSION_VIEW);
    assertNonEmpty(sessionId, 'sessionId');
    const session = await this.dependencies.repository.findSession(context, sessionId);
    if (!session) throw new AttendanceNotFoundError('Attendance session', sessionId);
    return session;
  }

  async recordAttendance(context: TrustedAttendanceContext, sessionId: string, input: RecordAttendanceInput, bulk = false): Promise<AttendanceRecord> {
    assertContext(context);
    const permission = bulk ? ATTENDANCE_PERMISSIONS.RECORD_BULK_CREATE : ATTENDANCE_PERMISSIONS.RECORD_CREATE;
    await requirePermission(this.dependencies.permissions.assert(context, permission), permission);
    assertNonEmpty(sessionId, 'sessionId');
    assertNonEmpty(input.studentId, 'studentId');
    assertNonEmpty(input.enrollmentId, 'enrollmentId');
    assertNonEmpty(input.idempotencyKey, 'idempotencyKey');
    assertNonEmpty(input.requestId, 'requestId');
    assertNonEmpty(input.correlationId, 'correlationId');
    assertStatus(input.status);

    return this.dependencies.transactions.run('attendance.record.create', async transaction => {
      const session = await this.dependencies.repository.findSession(context, sessionId, transaction);
      if (!session) throw new AttendanceNotFoundError('Attendance session', sessionId);
      if (session.status !== 'open') throw new AttendanceLockedError();
      const existingByKey = await this.dependencies.repository.findRecordByIdempotencyKey(context, input.idempotencyKey, transaction);
      if (existingByKey) {
        if (existingByKey.attendanceSessionId === sessionId && existingByKey.studentId === input.studentId) return existingByKey;
        throw new AttendanceDuplicateError();
      }
      await this.dependencies.eligibility.assertEligible(context, input.studentId, input.enrollmentId, session);
      const existing = await this.dependencies.repository.findRecord(context, sessionId, input.studentId, transaction);
      if (existing) throw new AttendanceDuplicateError();
      const record = await this.dependencies.repository.createRecord(context, input, session, transaction);
      await this.dependencies.audit.append(transaction, {
        operation: 'record.created', entityId: record.id, actorId: context.userId,
        tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId,
        requestId: input.requestId, correlationId: input.correlationId, newStatus: record.status,
      });
      await this.dependencies.outbox.enqueue(transaction, {
        eventType: 'AttendanceRecorded', aggregateType: 'attendance_record', aggregateId: record.id,
        idempotencyKey: input.idempotencyKey, tenantId: context.tenantId, schoolId: context.schoolId,
        branchId: context.branchId, requestId: input.requestId, correlationId: input.correlationId,
      });
      return record;
    });
  }

  async correctAttendance(context: TrustedAttendanceContext, input: CorrectAttendanceInput): Promise<AttendanceRecord> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.RECORD_CORRECT), ATTENDANCE_PERMISSIONS.RECORD_CORRECT);
    assertNonEmpty(input.recordId, 'recordId');
    assertNonEmpty(input.reason, 'reason');
    assertNonEmpty(input.idempotencyKey, 'idempotencyKey');
    assertNonEmpty(input.requestId, 'requestId');
    assertNonEmpty(input.correlationId, 'correlationId');
    assertStatus(input.status);

    return this.dependencies.transactions.run('attendance.record.correct', async transaction => {
      const record = await this.dependencies.repository.findRecordById(context, input.recordId, transaction);
      if (!record) throw new AttendanceNotFoundError('Attendance record', input.recordId);
      const session = await this.dependencies.repository.findSession(context, record.attendanceSessionId, transaction);
      if (!session) throw new AttendanceNotFoundError('Attendance session', record.attendanceSessionId);
      if (record.version !== input.expectedVersion) throw new AttendanceConcurrencyError();
      if (session.status === 'locked' && input.reason.trim() === '') throw new AttendanceLockedError();
      const corrected = await this.dependencies.repository.correctRecord(context, input, record, transaction);
      await this.dependencies.audit.append(transaction, {
        operation: 'record.corrected', entityId: record.id, actorId: context.userId,
        tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId,
        requestId: input.requestId, correlationId: input.correlationId, reason: input.reason,
        oldStatus: record.status, newStatus: corrected.status,
      });
      await this.dependencies.outbox.enqueue(transaction, {
        eventType: 'AttendanceCorrected', aggregateType: 'attendance_record', aggregateId: record.id,
        idempotencyKey: input.idempotencyKey, tenantId: context.tenantId, schoolId: context.schoolId,
        branchId: context.branchId, requestId: input.requestId, correlationId: input.correlationId,
      });
      return corrected;
    });
  }

  async lockSession(context: TrustedAttendanceContext, sessionId: string, expectedVersion: number, requestId: string, correlationId: string): Promise<AttendanceSession> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.SESSION_LOCK), ATTENDANCE_PERMISSIONS.SESSION_LOCK);
    assertNonEmpty(sessionId, 'sessionId');
    assertNonEmpty(requestId, 'requestId');
    assertNonEmpty(correlationId, 'correlationId');
    return this.dependencies.transactions.run('attendance.session.lock', async transaction => {
      const session = await this.dependencies.repository.findSession(context, sessionId, transaction);
      if (!session) throw new AttendanceNotFoundError('Attendance session', sessionId);
      if (session.status === 'locked') return session;
      if (session.version !== expectedVersion) throw new AttendanceConcurrencyError();
      const locked = await this.dependencies.repository.lockSession(context, sessionId, expectedVersion, transaction);
      await this.dependencies.audit.append(transaction, {
        operation: 'session.locked', entityId: session.id, actorId: context.userId,
        tenantId: context.tenantId, schoolId: context.schoolId, branchId: context.branchId,
        requestId, correlationId,
      });
      await this.dependencies.outbox.enqueue(transaction, {
        eventType: 'AttendanceSessionLocked', aggregateType: 'attendance_session', aggregateId: session.id,
        idempotencyKey: `attendance-lock:${session.id}:${expectedVersion}`, tenantId: context.tenantId,
        schoolId: context.schoolId, branchId: context.branchId, requestId, correlationId,
      });
      return locked;
    });
  }

  async getSessionRecords(context: TrustedAttendanceContext, sessionId: string): Promise<AttendanceRecord[]> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.RECORD_VIEW), ATTENDANCE_PERMISSIONS.RECORD_VIEW);
    assertNonEmpty(sessionId, 'sessionId');
    const session = await this.dependencies.repository.findSession(context, sessionId);
    if (!session) throw new AttendanceNotFoundError('Attendance session', sessionId);
    return this.dependencies.repository.listSessionRecords(context, sessionId);
  }

  async getStudentHistory(context: TrustedAttendanceContext, studentId: string): Promise<AttendanceRecord[]> {
    assertContext(context);
    await requirePermission(this.dependencies.permissions.assert(context, ATTENDANCE_PERMISSIONS.RECORD_VIEW), ATTENDANCE_PERMISSIONS.RECORD_VIEW);
    assertNonEmpty(studentId, 'studentId');
    return this.dependencies.repository.listStudentRecords(context, studentId);
  }
}
