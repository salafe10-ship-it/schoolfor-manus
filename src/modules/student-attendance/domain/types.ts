export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceSessionStatus = 'open' | 'locked';

export type TrustedAttendanceContext = {
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
  termId: string;
  userId: string;
  role: string;
};

export type AttendanceSession = {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
  termId: string;
  classId: string;
  sectionId: string;
  attendanceDate: string;
  periodId: string;
  status: AttendanceSessionStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  requestId: string;
  correlationId: string;
};

export type AttendanceRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  attendanceSessionId: string;
  studentId: string;
  enrollmentId: string;
  status: AttendanceStatus;
  recordedAt: string;
  recordedBy: string;
  correctedAt?: string;
  correctedBy?: string;
  correctionReason?: string;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  requestId: string;
  correlationId: string;
};

export type CreateAttendanceSessionInput = {
  classId: string;
  sectionId: string;
  attendanceDate: string;
  periodId: string;
  requestId: string;
  correlationId: string;
};

export type RecordAttendanceInput = {
  studentId: string;
  enrollmentId: string;
  status: AttendanceStatus;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
};

export type CorrectAttendanceInput = {
  recordId: string;
  expectedVersion: number;
  status: AttendanceStatus;
  reason: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
};

export type AttendanceAuditEvent = {
  operation: 'session.created' | 'record.created' | 'record.corrected' | 'session.locked';
  entityId: string;
  actorId: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  requestId: string;
  correlationId: string;
  reason?: string;
  oldStatus?: AttendanceStatus;
  newStatus?: AttendanceStatus;
};

export type AttendanceOutboxEvent = {
  eventType: 'AttendanceSessionCreated' | 'AttendanceRecorded' | 'AttendanceCorrected' | 'AttendanceSessionLocked';
  aggregateType: 'attendance_session' | 'attendance_record';
  aggregateId: string;
  idempotencyKey: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  requestId: string;
  correlationId: string;
};
