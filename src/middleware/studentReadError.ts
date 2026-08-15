import { TenantIsolationError } from '../tenant/TenantEngine';
import { AppError, AuthorizationError, DatabaseError, ValidationError } from '../utils/errors';

const STUDENT_READ_AUTHORIZATION_MESSAGE = 'تعذر الوصول إلى بيانات الطلاب المطلوبة.';
const STUDENT_READ_DATABASE_MESSAGE = 'تعذر قراءة بيانات الطلاب من محرك قاعدة البيانات.';

/**
 * Keeps expected tenant/security rejections distinct from unexpected failures.
 * The public response is intentionally generic and never carries database or
 * tenant-internal details.
 */
export function normalizeStudentReadError(error: unknown): AppError {
  if (error instanceof TenantIsolationError) {
    return new AuthorizationError(STUDENT_READ_AUTHORIZATION_MESSAGE);
  }

  if (error instanceof AuthorizationError) {
    return new AuthorizationError(STUDENT_READ_AUTHORIZATION_MESSAGE);
  }

  if (error instanceof ValidationError) {
    return error;
  }

  return new DatabaseError(STUDENT_READ_DATABASE_MESSAGE);
}
