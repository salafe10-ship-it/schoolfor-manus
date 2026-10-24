/** Synthetic-only tenant fixtures. Never replace these values with copied user data. */
export const isolatedTenantFixtures = {
  schools: [
    { id: 'test-school-alpha', name: 'مدرسة اختبار ألف', isSynthetic: true },
    { id: 'test-school-bravo', name: 'مدرسة اختبار باء', isSynthetic: true },
  ],
  branches: [
    { id: 'test-branch-alpha-east', schoolId: 'test-school-alpha', name: 'فرع اختبار ألف شرقي', isSynthetic: true },
    { id: 'test-branch-alpha-west', schoolId: 'test-school-alpha', name: 'فرع اختبار ألف غربي', isSynthetic: true },
    { id: 'test-branch-bravo-east', schoolId: 'test-school-bravo', name: 'فرع اختبار باء شرقي', isSynthetic: true },
    { id: 'test-branch-bravo-west', schoolId: 'test-school-bravo', name: 'فرع اختبار باء غربي', isSynthetic: true },
  ],
  users: [
    { id: 'test-user-alpha-admin', schoolId: 'test-school-alpha', branchId: null, role: 'school_admin', isSynthetic: true },
    { id: 'test-user-alpha-east-accountant', schoolId: 'test-school-alpha', branchId: 'test-branch-alpha-east', role: 'accountant', isSynthetic: true },
    { id: 'test-user-bravo-admin', schoolId: 'test-school-bravo', branchId: null, role: 'school_admin', isSynthetic: true },
    { id: 'test-user-bravo-west-accountant', schoolId: 'test-school-bravo', branchId: 'test-branch-bravo-west', role: 'accountant', isSynthetic: true },
  ],
  students: [
    { id: 'test-student-alpha-east-001', schoolId: 'test-school-alpha', branchId: 'test-branch-alpha-east', name: 'طالب اصطناعي ألف ١', isSynthetic: true },
    { id: 'test-student-alpha-west-001', schoolId: 'test-school-alpha', branchId: 'test-branch-alpha-west', name: 'طالب اصطناعي ألف ٢', isSynthetic: true },
    { id: 'test-student-bravo-east-001', schoolId: 'test-school-bravo', branchId: 'test-branch-bravo-east', name: 'طالب اصطناعي باء ١', isSynthetic: true },
    { id: 'test-student-bravo-west-001', schoolId: 'test-school-bravo', branchId: 'test-branch-bravo-west', name: 'طالب اصطناعي باء ٢', isSynthetic: true },
  ],
  fees: [
    { id: 'test-fee-alpha-001', schoolId: 'test-school-alpha', studentId: 'test-student-alpha-east-001', amountMinor: 120000, paidMinor: 0, currency: 'SAR', isSynthetic: true },
    { id: 'test-fee-bravo-001', schoolId: 'test-school-bravo', studentId: 'test-student-bravo-west-001', amountMinor: 135000, paidMinor: 0, currency: 'SAR', isSynthetic: true },
  ],
} as const;
