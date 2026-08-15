import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('DB-001-NONACC-008 persistence error-semantics reachability audit', () => {
  it('records only the direct fallback-read families that remain outside 010–015', () => {
    const files = [
      'src/database/repositories/AttendanceRepository.ts',
      'src/database/repositories/EmployeeRepository.ts',
      'src/database/repositories/InventoryRepository.ts'
    ];
    for (const file of files) {
      const text = source(file);
      expect(text).toContain('FallbackStorage');
      expect(text).toMatch(/catch\s*\([^)]*\)[\s\S]{0,700}FallbackStorage/);
    }
  });

  it('records the fail-closed contract for paths closed by 010–015', () => {
    const closedReadRepositories = [
      ['src/database/repositories/StudentDocumentRepository.ts', '010'],
      ['src/database/repositories/StudentAssetRepository.ts', '011'],
      ['src/database/repositories/StudentLibraryAccountRepository.ts', '011'],
      ['src/database/repositories/StudentMedicalRecordRepository.ts', '011'],
      ['src/database/repositories/TransportationRepository.ts', '012'],
      ['src/database/repositories/UniformRepository.ts', '012'],
      ['src/database/repositories/ReportRepository.ts', '013'],
      ['src/database/repositories/BIRepository.ts', '013'],
      ['src/database/repositories/MDMRepository.ts', '014'],
      ['src/database/repositories/IntegrationRepository.ts', '014'],
      ['src/database/repositories/AIRepository.ts', '015'],
      ['src/database/repositories/BackupRepository.ts', '015']
    ] as const;

    for (const [file, mission] of closedReadRepositories) {
      const text = source(file);
      expect(text, `${file} closed by DB-001-NONACC-${mission}`).toContain('FallbackStorage.performRead');
    }
  });

  it('confirms canonical controls are present for already-contained paths', () => {
    const fallback = source('src/database/repositories/FallbackStorage.ts');
    const students = source('src/database/repositories/StudentRepository.ts');
    const configuration = source('src/database/repositories/ConfigurationRepository.ts');

    expect(fallback).toContain('assertCanonicalPersistence');
    expect(fallback).toContain('performRead');
    expect(fallback).toContain('performWrite');
    expect(students).toContain("FallbackStorage.assertCanonicalPersistence('student read')");
    expect(students).toContain("FallbackStorage.assertCanonicalPersistence('student search')");
    expect(configuration).toContain('throw err');
  });

  it('confirms the audit itself does not authorize database or production execution', () => {
    const report = source('docs/platform-release/db-001-nonacc-008-validation.md');
    expect(report).toContain('Source mutation during 008: NONE');
    expect(report).toContain('Live database/RLS/production test: NOT RUN');
    expect(report).toContain('P1/P2 HARDENING REQUIRED');
  });
});
