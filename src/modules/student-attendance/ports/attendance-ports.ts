import type {
  AttendanceAuditEvent,
  AttendanceOutboxEvent,
  AttendanceRecord,
  AttendanceSession,
  CorrectAttendanceInput,
  CreateAttendanceSessionInput,
  RecordAttendanceInput,
  TrustedAttendanceContext,
} from '../domain/types';

export type AttendanceTransaction = { readonly id: string };

export type AttendancePermissionAuthorizer = {
  assert(context: TrustedAttendanceContext, permission: string): void | Promise<void>;
};

export type AttendanceTransactionManager = {
  run<T>(operation: string, callback: (transaction: AttendanceTransaction) => Promise<T>): Promise<T>;
};

export type AttendanceRepository = {
  findSession(context: TrustedAttendanceContext, sessionId: string, transaction?: AttendanceTransaction): Promise<AttendanceSession | null>;
  listSessions(context: TrustedAttendanceContext, transaction?: AttendanceTransaction): Promise<AttendanceSession[]>;
  createSession(context: TrustedAttendanceContext, input: CreateAttendanceSessionInput, transaction: AttendanceTransaction): Promise<AttendanceSession>;
  lockSession(context: TrustedAttendanceContext, sessionId: string, expectedVersion: number, transaction: AttendanceTransaction): Promise<AttendanceSession>;
  findRecord(context: TrustedAttendanceContext, sessionId: string, studentId: string, transaction?: AttendanceTransaction): Promise<AttendanceRecord | null>;
  findRecordById(context: TrustedAttendanceContext, recordId: string, transaction?: AttendanceTransaction): Promise<AttendanceRecord | null>;
  findRecordByIdempotencyKey(context: TrustedAttendanceContext, idempotencyKey: string, transaction?: AttendanceTransaction): Promise<AttendanceRecord | null>;
  createRecord(context: TrustedAttendanceContext, input: RecordAttendanceInput, session: AttendanceSession, transaction: AttendanceTransaction): Promise<AttendanceRecord>;
  correctRecord(context: TrustedAttendanceContext, input: CorrectAttendanceInput, record: AttendanceRecord, transaction: AttendanceTransaction): Promise<AttendanceRecord>;
  listSessionRecords(context: TrustedAttendanceContext, sessionId: string, transaction?: AttendanceTransaction): Promise<AttendanceRecord[]>;
  listStudentRecords(context: TrustedAttendanceContext, studentId: string, transaction?: AttendanceTransaction): Promise<AttendanceRecord[]>;
};

export type AttendanceEligibility = {
  assertEligible(context: TrustedAttendanceContext, studentId: string, enrollmentId: string, session: AttendanceSession): Promise<void>;
};

export type AttendanceAuditSink = {
  append(transaction: AttendanceTransaction, event: AttendanceAuditEvent): Promise<void>;
};

export type AttendanceOutboxSink = {
  enqueue(transaction: AttendanceTransaction, event: AttendanceOutboxEvent): Promise<void>;
};

export type AttendanceDependencies = {
  repository: AttendanceRepository;
  eligibility: AttendanceEligibility;
  permissions: AttendancePermissionAuthorizer;
  transactions: AttendanceTransactionManager;
  audit: AttendanceAuditSink;
  outbox: AttendanceOutboxSink;
};
