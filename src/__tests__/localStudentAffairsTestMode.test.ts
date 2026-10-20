import { afterEach, describe, expect, it } from 'vitest';
import {
  isLocalStudentAffairsTestMode,
  isLocalStudentAffairsTestToken,
  localStudentAffairsTestFailurePayload,
  localStudentAffairsTestFinancialContext,
  localStudentAffairsTestFinancialSnapshot,
  localStudentAffairsTestIdentity,
  shouldSimulateSupabaseExhaustion,
} from '../../server/infrastructure/LocalStudentAffairsTestMode';

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe('local Student Affairs test mode', () => {
  it('is disabled unless the test runtime flag is explicit', () => {
    process.env.NODE_ENV = 'development';
    process.env.EDUPRO_LOCAL_STUDENT_AFFAIRS_TEST = 'true';
    expect(isLocalStudentAffairsTestMode()).toBe(false);
    expect(isLocalStudentAffairsTestToken('local-student-affairs-test-token')).toBe(false);
  });

  it('simulates only configured paths and does not expose a real school write', () => {
    process.env.NODE_ENV = 'test';
    process.env.EDUPRO_LOCAL_STUDENT_AFFAIRS_TEST = 'true';
    process.env.EDUPRO_TEST_FAULT = 'supabase-exhausted';
    process.env.EDUPRO_TEST_FAULT_PATHS = '/api/students,/api/student-affairs/metrics';

    expect(shouldSimulateSupabaseExhaustion({ method: 'GET', path: '/api/students' })).toBe(true);
    expect(shouldSimulateSupabaseExhaustion({ method: 'GET', path: '/api/health' })).toBe(false);
    expect(shouldSimulateSupabaseExhaustion({ method: 'POST', path: '/api/students' })).toBe(true);

    const payload = localStudentAffairsTestFailurePayload();
    expect(payload).toMatchObject({
      success: false,
      errorCode: 'TEST_SUPABASE_DATABASE_EXHAUSTED',
      data: { simulated: true, schoolDataTouched: false, retryable: true },
    });
  });

  it('provides a fixed non-production identity for the loopback harness', () => {
    process.env.NODE_ENV = 'test';
    process.env.EDUPRO_LOCAL_STUDENT_AFFAIRS_TEST = 'true';
    const identity = localStudentAffairsTestIdentity();
    expect(identity.schoolId).toBe('school_1');
    expect(identity.branchId).toBe('branch_1_1');
    expect(identity.platformPermissions).toEqual([]);
    expect(identity.permissions).not.toContain('Platform.Admin');
  });

  it('provides an isolated read-only financial context and empty snapshot', () => {
    process.env.NODE_ENV = 'test';
    process.env.EDUPRO_LOCAL_STUDENT_AFFAIRS_TEST = 'true';
    expect(localStudentAffairsTestFinancialContext()).toMatchObject({
      academicYearName: '2026/2027 (الفصل الأول)',
      academicPeriodName: 'الفصل الأول',
      branchId: 'branch_1_1',
    });
    expect(localStudentAffairsTestFinancialSnapshot()).toMatchObject({
      invoices: [],
      studentReceiptVouchers: [],
      receiptVouchers: [],
      journalEntries: [],
    });
  });
});
