import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const guardianServiceSource = root('src/database/services/StudentGuardianService.ts');
const guardianRepositorySource = root('src/database/repositories/GuardianRepository.ts');
const serverSource = root('server.ts');
const portalSource = root('src/components/StudentAffairsPortal.tsx');
const appSource = root('src/App.tsx');
const canonicalRegistrationSource = root('src/modules/student-registration/application/StudentRegistrationService.ts');
const canonicalGuardianUpdateSource = root('src/modules/student-registration/application/CanonicalGuardianUpdateService.ts');
const studentRepositorySource = root('src/components/student-affairs/repository/StudentRepository.ts');
const canonicalStudentReadSource = root('src/database/repositories/CanonicalStudentReadRepository.ts');

describe('STU-AFFAIRS-P0-003-02A canonical Guardian boundary', () => {
  it('blocks the legacy Guardian creation path before synthetic persistence', () => {
    expect(guardianServiceSource).toContain("LEGACY_GUARDIAN_CREATE_BLOCKED");
    expect(guardianServiceSource).toContain('throw new ValidationError(CANONICAL_GUARDIAN_REQUIRED');
    expect(guardianServiceSource).not.toContain('guard_${Date.now()}');
    expect(guardianServiceSource).not.toContain('@alnoor.edu.sa');
    expect(guardianServiceSource).not.toContain('FallbackStorage.get');
  });

  it('blocks legacy Guardian synchronization instead of silently updating fallback data', () => {
    expect(guardianServiceSource).toContain("LEGACY_GUARDIAN_UPDATE_BLOCKED");
    expect(guardianServiceSource).not.toContain('getStudentGuardians');
    expect(guardianServiceSource).not.toContain('enlistUpdateGuardian');
  });

  it('quarantines every legacy Guardian mutation method', () => {
    expect(guardianRepositorySource).toContain("LEGACY_GUARDIAN_CREATE_BLOCKED");
    expect(guardianRepositorySource).toContain("LEGACY_GUARDIAN_UPDATE_BLOCKED");
    expect(guardianRepositorySource).toContain('Guardian mutations must use the canonical StudentRegistrationService boundary.');
    expect(guardianRepositorySource).not.toContain('INSERT INTO guardians');
    expect(guardianRepositorySource).not.toContain('UPDATE guardians SET');
  });

  it('rejects Guardian fields on canonical Student update instead of returning false success', () => {
    expect(serverSource).toContain('function hasGuardianUpdateFields');
    expect(serverSource).toContain('CANONICAL_GUARDIAN_UPDATE_REQUIRED');
    expect(serverSource).toContain('Guardian updates require the canonical Guardian workflow');
  });

  it('routes supported Guardian edits through the canonical update endpoint', () => {
    expect(portalSource).toContain('StudentRepository.updateGuardian');
    expect(appSource).toContain('StudentApiRepository.updateGuardian');
    expect(portalSource).toContain('if (!isEditMode)');
    expect(appSource).toContain('...(editingStudent ? {} : {');
  });

  it('requires trusted scope, optimistic versions, one UnitOfWork and audit/outbox enlistment', () => {
    expect(canonicalGuardianUpdateSource).toContain('assertNoClientScope(command)');
    expect(canonicalGuardianUpdateSource).toContain('expectedGuardianVersion');
    expect(canonicalGuardianUpdateSource).toContain('expectedRelationshipVersion');
    expect(canonicalGuardianUpdateSource).toContain('UnitOfWork.runInTransaction(');
    expect(canonicalGuardianUpdateSource).toContain('FOR UPDATE OF s, sg, g');
    expect(canonicalGuardianUpdateSource).toContain('enqueueGuardianAuditEvent({');
    expect(canonicalGuardianUpdateSource).toContain('enqueueGuardianOutboxEvent({');
    expect(canonicalGuardianUpdateSource).toContain('STALE_GUARDIAN_VERSION');
  });

  it('exposes only canonical Guardian metadata to the client and uses PATCH', () => {
    expect(studentRepositorySource).toContain('async updateGuardian');
    expect(studentRepositorySource).toContain('method: "PATCH"');
    expect(studentRepositorySource).toContain('/guardian`');
    expect(canonicalStudentReadSource).toContain('guardian_relationship_version');
    expect(canonicalStudentReadSource).toContain('guardianVersion');
    expect(canonicalStudentReadSource).toContain('guardianRelationshipVersion');
  });

  it('keeps canonical Guardian resolution inside the registration transaction', () => {
    expect(canonicalRegistrationSource).toContain('UnitOfWork.runInTransaction(');
    expect(canonicalRegistrationSource).toContain('resolveGuardian(');
    expect(canonicalRegistrationSource).toContain('enqueueStudentGuardian({');
    expect(canonicalRegistrationSource).toContain("affectedTables: ['students', 'guardians', 'student_guardians'");
  });
});
