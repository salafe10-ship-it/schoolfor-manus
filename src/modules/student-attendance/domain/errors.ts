export class AttendanceDomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AttendanceContextError extends AttendanceDomainError {
  constructor(message = 'Trusted attendance context is required') {
    super('ATTENDANCE_CONTEXT_REQUIRED', message);
  }
}

export class AttendancePermissionError extends AttendanceDomainError {
  constructor(permission: string) {
    super('ATTENDANCE_PERMISSION_DENIED', `Permission denied: ${permission}`);
  }
}

export class AttendanceValidationError extends AttendanceDomainError {
  constructor(message: string) {
    super('ATTENDANCE_VALIDATION_ERROR', message);
  }
}

export class AttendanceNotFoundError extends AttendanceDomainError {
  constructor(entity: string, id: string) {
    super('ATTENDANCE_NOT_FOUND', `${entity} not found: ${id}`);
  }
}

export class AttendanceDuplicateError extends AttendanceDomainError {
  constructor() {
    super('ATTENDANCE_DUPLICATE_RECORD', 'A student already has a record for this session');
  }
}

export class AttendanceLockedError extends AttendanceDomainError {
  constructor() {
    super('ATTENDANCE_SESSION_LOCKED', 'The attendance session is locked');
  }
}

export class AttendanceConcurrencyError extends AttendanceDomainError {
  constructor() {
    super('ATTENDANCE_CONCURRENCY_CONFLICT', 'The attendance record or session was changed by another request');
  }
}

export class AttendanceSchemaDependencyError extends AttendanceDomainError {
  constructor(message: string) {
    super('ATTENDANCE_SCHEMA_DEPENDENCY', message);
  }
}
