import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import StudentFinancialPortal from '../../src/components/StudentFinancialPortal';
import { isolatedTenantFixtures } from '../fixtures/isolatedTenants';
import '../../src/index.css';

const school = isolatedTenantFixtures.schools[0];
const fixtureStudent = {
  ...isolatedTenantFixtures.students[0],
  academicId: 'TEST-ALPHA-001',
  classroom: 'الصف التجريبي الأول',
  section: 'أ',
  isDeleted: false
} as any;
const fixtureInvoice = {
  id: 'test-invoice-alpha-001',
  studentId: fixtureStudent.id,
  studentName: fixtureStudent.name,
  item: 'رسوم اختبار دراسي',
  amount: 1200,
  remainingAmount: 1100,
  paidAmount: 100,
  status: 'partial',
  invoiceDate: '2026-10-01',
  dueDate: '2026-10-31',
  currency: 'SAR'
} as any;

const savedPlan = {
  planId: 'test-plan-alpha-001',
  invoiceId: fixtureInvoice.id,
  studentId: fixtureStudent.id,
  totalAmount: 1200,
  frequency: 'quarterly',
  method: 'equal',
  installmentCount: 3,
  currency: 'SAR',
  status: 'approved',
  item: fixtureInvoice.item,
  schedules: [
    { scheduleId: 'test-schedule-alpha-001', installmentNumber: 1, dueDate: '2026-10-15', amount: 400, paidAmount: 100, status: 'partially_paid' },
    { scheduleId: 'test-schedule-alpha-002', installmentNumber: 2, dueDate: '2027-01-15', amount: 400, paidAmount: 0, status: 'unpaid' },
    { scheduleId: 'test-schedule-alpha-003', installmentNumber: 3, dueDate: '2027-04-15', amount: 400, paidAmount: 0, status: 'unpaid' }
  ]
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

window.localStorage.setItem('edupro_token', 'test-local-fees-preview-token');

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
  if (init?.method === 'POST') {
    return response({ success: false, message: 'الكتابة المالية معطلة في معاينة الاختبار المحلية.' }, 423);
  }
  if (requestUrl.pathname === '/api/financial/database') {
    return response({
      success: true,
      data: {
        invoices: [fixtureInvoice],
        studentReceiptVouchers: [],
        receiptVouchers: [],
        journalEntries: [],
        chartOfAccounts: [],
        feeConfigs: [],
        expenseAccruals: []
      },
      meta: { writeMode: 'snapshot_read_only', version: 1 }
    });
  }
  if (requestUrl.pathname === '/api/financial/operational-context') {
    return response({ success: true, data: { academicYearId: 'test-year-alpha', academicPeriodId: 'test-period-alpha', financialPeriod: '2026-2027' } });
  }
  if (requestUrl.pathname.endsWith('/installment-plans')) {
    return response({ success: true, data: [savedPlan] });
  }
  if (requestUrl.pathname === '/api/financial/installment-plans/overdue-summary') {
    return response({ success: true, data: { asOf: '2026-10-22', count: 0, overdueAmount: 0, rows: [] } });
  }
  if (requestUrl.pathname === '/api/academic/context') {
    return response({ success: true, data: { stages: [], grades: [], classes: [] } });
  }
  return response({ success: true, data: [] });
};

function LocalFeesPreview() {
  const [students, setStudents] = useState([fixtureStudent]);
  const [invoices, setInvoices] = useState([fixtureInvoice]);
  return (
    <StudentFinancialPortal
      students={students}
      setStudents={setStudents}
      invoices={invoices}
      setInvoices={setInvoices}
      filteredStudents={students}
      handleStudentPaymentSubmit={() => undefined}
      currentRole="SchoolAdmin"
      setActiveSection={() => undefined}
      logAction={() => undefined}
      triggerNotification={() => undefined}
      selectedSchool={school}
      selectedBranch={isolatedTenantFixtures.branches[0]}
    />
  );
}

createRoot(document.getElementById('student-fees-qa-root')!).render(<LocalFeesPreview />);
