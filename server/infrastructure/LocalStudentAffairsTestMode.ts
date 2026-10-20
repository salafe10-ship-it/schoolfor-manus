import type { Request } from 'express';
import { PERMISSIONS } from '../../src/authorization/PermissionRegistry.js';

export const LOCAL_STUDENT_AFFAIRS_TEST_TOKEN = 'local-student-affairs-test-token';
export const LOCAL_STUDENT_AFFAIRS_TEST_USERNAME = 'student-affairs-test';
export const LOCAL_STUDENT_AFFAIRS_TEST_PASSWORD = 'student-affairs-test-password';

const LOCAL_TEST_ID = '00000000-0000-4000-8000-000000000001';
const LOCAL_TEST_TENANT_ID = '00000000-0000-4000-8000-000000000002';
export const LOCAL_TEST_ACADEMIC_YEAR_ID = '00000000-0000-4000-8000-000000000003';
export const LOCAL_TEST_ACADEMIC_PERIOD_ID = '00000000-0000-4000-8000-000000000004';

export function isLocalStudentAffairsTestMode(): boolean {
  return process.env.NODE_ENV === 'test'
    && process.env.EDUPRO_LOCAL_STUDENT_AFFAIRS_TEST === 'true';
}

export function isLocalStudentAffairsTestToken(token: string | null | undefined): boolean {
  return isLocalStudentAffairsTestMode() && token === LOCAL_STUDENT_AFFAIRS_TEST_TOKEN;
}

export function localStudentAffairsTestIdentity() {
  return {
    id: LOCAL_TEST_ID,
    email: 'student-affairs-test@localhost.test',
    name: 'مستخدم اختبار شؤون الطلاب',
    tenantId: LOCAL_TEST_TENANT_ID,
    schoolId: 'school_1',
    role: 'SchoolAdmin' as const,
    branchId: 'branch_1_1',
    academicYear: '2026/2027 (الفصل الأول)',
    permissions: Object.values(PERMISSIONS).filter(permission => permission !== PERMISSIONS.PLATFORM_ADMIN),
    platformPermissions: [],
    school: {
      id: 'school_1',
      name: 'مدرسة الاختبار المعزولة',
      status: 'active',
      portalProfile: 'internal',
    },
    branch: {
      id: 'branch_1_1',
      name: 'الفرع الرئيسي (بيئة الاختبار)',
    },
    forcePasswordChange: false,
  };
}

export function localStudentAffairsTestFinancialContext() {
  return {
    academicYearId: LOCAL_TEST_ACADEMIC_YEAR_ID,
    academicYearName: '2026/2027 (الفصل الأول)',
    academicPeriodId: LOCAL_TEST_ACADEMIC_PERIOD_ID,
    academicPeriodName: 'الفصل الأول',
    branchId: 'branch_1_1',
    financialPeriod: '2026/2027 (الفصل الأول)',
  };
}

export function localStudentAffairsTestFinancialSnapshot() {
  return {
    invoices: [],
    studentReceiptVouchers: [],
    receiptVouchers: [],
    feeConfigs: [],
    feeSettings: { siblingDiscountPercent: 0 },
    paymentVouchers: [],
    journalEntries: [],
    chartOfAccounts: [],
    costCenters: [],
    expenseAccruals: [],
  };
}

export function shouldSimulateSupabaseExhaustion(req: Pick<Request, 'method' | 'path'>): boolean {
  if (!isLocalStudentAffairsTestMode() || process.env.EDUPRO_TEST_FAULT !== 'supabase-exhausted') return false;
  if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) return false;

  const configuredPaths = String(process.env.EDUPRO_TEST_FAULT_PATHS || '')
    .split(',')
    .map(path => path.trim())
    .filter(Boolean);
  return configuredPaths.includes(req.path);
}

export function localStudentAffairsTestFailurePayload() {
  return {
    success: false,
    errorCode: 'TEST_SUPABASE_DATABASE_EXHAUSTED',
    message: 'بيئة الاختبار: تمت محاكاة استنفاد قاعدة بيانات Supabase. لم يتم تعديل أي بيانات.',
    data: {
      simulated: true,
      failureScope: 'database-resource-exhaustion',
      schoolDataTouched: false,
      retryable: true,
    },
  };
}
