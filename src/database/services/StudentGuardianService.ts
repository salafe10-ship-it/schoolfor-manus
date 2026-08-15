import { ValidationError } from '../../utils/errors';

const CANONICAL_GUARDIAN_REQUIRED = 'Guardian mutations must use the canonical StudentRegistrationService boundary.';

export class StudentGuardianService {
  /**
   * Enlists the creation of a Guardian and its relationship with the student.
   */
  public static enlistCreateGuardianRelation(
    schoolId: string,
    studentId: string,
    studentData: any
  ): void {
    // Legacy StudentAdmissionService still calls this method from the bulk path.
    // It must never fabricate a Guardian or write through FallbackStorage.
    if (studentData?.parentName || studentData?.parentPhone) {
      throw new ValidationError(CANONICAL_GUARDIAN_REQUIRED, {
        errorCode: 'STU-GUARD-001',
        reason: 'LEGACY_GUARDIAN_CREATE_BLOCKED',
        schoolId,
        studentId
      });
    }
  }

  /**
   * Synchronizes guardian information if parent details are modified on the student record.
   */
  public static syncGuardians(
    studentId: string,
    updates: { parentName?: string; parentPhone?: string },
    existing: { parentName?: string; parentPhone?: string }
  ): void {
    if (
      (updates.parentName && updates.parentName !== existing.parentName) ||
      (updates.parentPhone && updates.parentPhone !== existing.parentPhone)
    ) {
      // Do not report a Student update as successful while a Guardian update is
      // being silently attempted through legacy local storage/SQL.
      throw new ValidationError(CANONICAL_GUARDIAN_REQUIRED, {
        errorCode: 'STU-GUARD-002',
        reason: 'LEGACY_GUARDIAN_UPDATE_BLOCKED',
        studentId
      });
    }
  }
}
