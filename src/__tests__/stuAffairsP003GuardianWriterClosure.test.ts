import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const migrationSource = root('src/database/migrations/student_affairs_tables.ts');
const migrationInitSource = root('src/database/migrations/init.ts');
const guardianRepositorySource = root('src/database/repositories/GuardianRepository.ts');
const relationshipRepositorySource = root('src/database/repositories/StudentGuardianRepository.ts');
const guardianServiceSource = root('src/database/services/StudentGuardianService.ts');
const registrationInfrastructureSource = root('src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts');
const canonicalUpdateSource = root('src/modules/student-registration/application/CanonicalGuardianUpdateService.ts');
const unitOfWorkSource = root('src/database/UnitOfWork.ts');

describe('STU-AFFAIRS-P0-003-05 Guardian writer closure', () => {
  it('keeps Guardian creation only inside the canonical registration infrastructure', () => {
    expect(registrationInfrastructureSource).toContain('INSERT INTO guardians');
    expect(registrationInfrastructureSource).toContain('INSERT INTO student_guardians');
    expect(registrationInfrastructureSource).toContain('TRUSTED_TENANT_CONTEXT');
    expect(canonicalUpdateSource).toContain('UPDATE public.guardians');
    expect(canonicalUpdateSource).toContain('UPDATE public.student_guardians');
  });

  it('fail-closes every legacy repository/service mutation entry point', () => {
    expect(guardianRepositorySource).toContain('LEGACY_GUARDIAN_CREATE_BLOCKED');
    expect(guardianRepositorySource).toContain('LEGACY_GUARDIAN_UPDATE_BLOCKED');
    expect(guardianRepositorySource).toContain('LEGACY_GUARDIAN_DELETE_BLOCKED');
    expect(relationshipRepositorySource).toContain('LEGACY_RELATION_MUTATION_BLOCKED');
    expect(guardianServiceSource).toContain('LEGACY_GUARDIAN_CREATE_BLOCKED');
    expect(guardianServiceSource).toContain('LEGACY_GUARDIAN_UPDATE_BLOCKED');
  });

  it('contains no direct legacy Guardian migration writes', () => {
    expect(migrationSource).not.toContain("from('guardians').insert");
    expect(migrationSource).not.toContain("from('student_guardians').insert");
    expect(migrationSource).toContain('LEGACY_GUARDIAN_WRITER_BLOCKED');
    expect(migrationInitSource).toContain('StudentAffairsMigration.migrateAll()');
  });

  it('does not add a production fallback Guardian writer', () => {
    expect(unitOfWorkSource).toContain("case 'guardians': FallbackStorage.saveGuardians(list)");
    expect(unitOfWorkSource).toContain("case 'student_guardians': FallbackStorage.saveStudentGuardians(list)");
    expect(registrationInfrastructureSource).toContain('requires an active PostgreSQL transaction');
    expect(canonicalUpdateSource).toContain('Canonical Guardian updates require an active PostgreSQL transaction');
  });
});
