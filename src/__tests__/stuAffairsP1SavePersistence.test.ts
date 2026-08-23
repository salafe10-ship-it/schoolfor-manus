import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const portalSource = readFileSync('src/components/StudentAffairsPortal.tsx', 'utf8');
const repositorySource = readFileSync('src/components/student-affairs/repository/StudentRepository.ts', 'utf8');
const authSource = readFileSync('src/utils/auth.ts', 'utf8');
const serverSource = readFileSync('server.ts', 'utf8');

describe('STU-AFFAIRS-P1 save and persistence contract', () => {
  it('surfaces server validation, permission, and persistence errors', () => {
    expect(repositorySource).toContain('data.message || data.error');
    expect(portalSource).toContain("const errorMessage = error?.message || 'تعذر حفظ سجل الطالب في الخادم.'");
    expect(portalSource).toContain("triggerNotification(errorMessage, 'warning')");
  });

  it('acquires the active trusted token through the shared authenticated request layer', () => {
    expect(authSource).toContain('TrustedSessionManager');
    expect(authSource).toContain('getTrustedAccessTokenAsync');
    expect(repositorySource).toContain("from '../../../utils/authenticatedRequest'");
    expect(repositorySource).toContain('authenticatedRequest');
    expect(repositorySource).not.toContain('localStorage.getItem("edupro_token")');
    expect(repositorySource).not.toContain('sessionStorage.getItem("edupro_token")');
  });

  it('refreshes the canonical list after registration instead of inserting the registration summary as a row', () => {
    expect(portalSource).toContain('const [studentRefreshToken, setStudentRefreshToken] = useState(0);');
    expect(portalSource).toContain('studentRefreshToken, setStudents');
    expect(portalSource).toContain('Registration returns a canonical registration summary, not a list row.');
    expect(portalSource).not.toContain('setStudents(current => [persistedStudent, ...current]);');
  });

  it('keeps registration on the trusted canonical transaction path', () => {
    expect(serverSource).toContain('resolveStudentTenantContext(req)');
    expect(serverSource).toContain('studentRegistrationService.register');
    expect(serverSource).toContain('requirePermission(PERMISSIONS.STUDENT_REGISTRATION_CREATE)');
    expect(serverSource).toContain('toCanonicalRegistrationCommand(tenantContext, (req.body || {}) as Record<string, any>)');
    expect(repositorySource).toContain('"/api/student-registration"');
    expect(repositorySource).toContain('"Idempotency-Key": idempotencyKey');
  });

  it('uses the same active token source for direct Student Affairs requests', () => {
    const searchPanelSource = readFileSync('src/components/student-affairs/StudentSearchPanel.tsx', 'utf8');
    expect(searchPanelSource).toContain('StudentRepository');
    expect(repositorySource).toContain('authenticatedRequest');
    expect(searchPanelSource).not.toContain('localStorage.getItem("edupro_token")');
  });

  it('does not report success through the local fallback when PostgreSQL is unavailable', () => {
    const serviceSource = readFileSync('src/modules/student-registration/application/StudentRegistrationService.ts', 'utf8');
    expect(serviceSource).toContain('UnitOfWork.hasTransactionDriver()');
    expect(serviceSource).toContain('STU-PERSISTENCE-001');
    expect(serviceSource).toContain('no persistence was attempted');
  });
});
