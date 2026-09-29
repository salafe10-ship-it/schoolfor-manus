import { describe, expect, it } from 'vitest';
import {
  areExamReadinessChecksPassing,
  includeCentralSourceCheck,
  type ExamReadinessCheck,
} from '../utils/examReadinessDiagnostics';

describe('exam readiness diagnostics', () => {
  const passingChecks: ExamReadinessCheck[] = [
    { id: 1, name: 'تهيئة الدورة', status: 'success', desc: 'مكتمل' },
    { id: 2, name: 'النتائج', status: 'success', desc: 'مكتمل' },
  ];

  it.each(['idle', 'conflict', 'rejected', 'error'] as const)(
    'blocks closure readiness when central source status is %s',
    syncStatus => {
      const checks = includeCentralSourceCheck(passingChecks, syncStatus);

      expect(checks[0]).toMatchObject({
        id: 'central-source',
        name: 'اتصال المصدر المركزي',
        status: 'warning',
      });
      expect(areExamReadinessChecksPassing(checks)).toBe(false);
    },
  );

  it('only reports current checks as passing when the central source is verified', () => {
    const checks = includeCentralSourceCheck(passingChecks, 'success');

    expect(checks[0].status).toBe('success');
    expect(areExamReadinessChecksPassing(checks)).toBe(true);
  });

  it('does not treat an empty diagnostic run as ready', () => {
    expect(areExamReadinessChecksPassing([])).toBe(false);
  });
});
