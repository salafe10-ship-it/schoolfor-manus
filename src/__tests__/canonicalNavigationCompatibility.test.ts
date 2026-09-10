import { describe, expect, it } from 'vitest';
import { canonicalSectionRoute } from '../navigation/CanonicalSectionRoute';
import { canRestoreSchoolPortalSession } from '../security/SchoolPortalSessionBoundary';
import { isSectionFeatureEnabled } from '../security/SectionFeaturePolicy';
import { toTrustedSchoolPresentation } from '../middleware/trustedSchoolIdentity';

const SCHOOL_ID = 'be687819-4d8d-427f-8479-81c0b70c35e1';

describe('canonical customer navigation compatibility', () => {
  it('redirects historical routes to current workspaces', () => {
    expect(canonicalSectionRoute('permissions_admin', 'school')).toBe('school_users_admin');
    expect(canonicalSectionRoute('permissions_admin', 'admin')).toBe('super_rbac');
    expect(canonicalSectionRoute('student_affairs', 'school')).toBe('students');
    expect(canonicalSectionRoute('hr', 'school')).toBe('teachers');
    expect(canonicalSectionRoute('buses', 'school')).toBe('school_transport');
    expect(canonicalSectionRoute('uniform_management', 'school')).toBe('school_uniform');
  });

  it('restores only a session for the exact UUID school URL', () => {
    expect(canRestoreSchoolPortalSession(SCHOOL_ID, SCHOOL_ID)).toBe(true);
    expect(canRestoreSchoolPortalSession(SCHOOL_ID, '11111111-1111-4111-8111-111111111111')).toBe(false);
    expect(canRestoreSchoolPortalSession('school-code', SCHOOL_ID)).toBe(false);
  });

  it('migrates the retired feature key without losing the customer setting', () => {
    const school = toTrustedSchoolPresentation({
      id: SCHOOL_ID,
      display_name: 'مدرسة العميل',
      status: 'active',
      central_metadata: { features: { permissions_admin: false, students: true } },
    });
    expect(school.features).toEqual({ school_users_admin: false, students: true });
    expect(isSectionFeatureEnabled('school_users_admin', school.features)).toBe(false);
    expect(isSectionFeatureEnabled('students', school.features)).toBe(true);
    expect(isSectionFeatureEnabled('exams', school.features)).toBe(true);
  });
});
