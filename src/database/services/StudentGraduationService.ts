import { BusinessRuleError } from '../../utils/errors';
import { AuditMetadata } from '../../types';

export class StudentGraduationService {
  /**
   * Graduation is intentionally fail-closed until an authoritative graduation
   * aggregate/record exists. This prevents the legacy path from returning a
   * fabricated registry entry or reporting a successful mutation.
   */
  public static async graduateStudent(
    schoolId: string,
    id: string,
    meta: AuditMetadata
  ): Promise<never> {
    void schoolId;
    void id;
    void meta;
    throw new BusinessRuleError(
      'عملية التخرج موقوفة مؤقتًا حتى يتوفر سجل تخرج أكاديمي موثوق وقابل للتدقيق.'
    );
  }
}
