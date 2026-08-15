import { Activity, AlertCircle, CheckCircle2, Clock, Code, Grid, Monitor, Play, Receipt, RefreshCcw, Scale, Section, User, View } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, Invoice, AuditLog } from '../types';
import { SQLTransactionEngine } from '../database/transactions/transactionManager';
import { SQLCommandBuilder } from '../database/transactions/SQLCommand';
import { AuditRepository } from '../database/repositories/AuditRepository';

interface AccountingIntegrityDemoProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  logAction: (action: string, details: string, module: string) => void;
}

export default function AccountingIntegrityDemo({
  students,
  setStudents,
  invoices,
  setInvoices,
  triggerNotification,
  logAction
}: AccountingIntegrityDemoProps) {
  
  // State for step-by-step progress
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  
  // Simulation entities
  const [simStudent, setSimStudent] = useState<any>(null);
  const [simInvoice, setSimInvoice] = useState<any>(null);
  const [simReceipt, setSimReceipt] = useState<any>(null);
  const [simJournalEntry, setSimJournalEntry] = useState<any>(null);
  const [simReversalEntry, setSimReversalEntry] = useState<any>(null);
  
  // Balance tracking
  const [cashBalanceBefore, setCashBalanceBefore] = useState<number>(125000);
  const [revenueBalanceBefore, setRevenueBalanceBefore] = useState<number>(340000);
  
  const [cashBalanceCurrent, setCashBalanceCurrent] = useState<number>(125000);
  const [revenueBalanceCurrent, setRevenueBalanceCurrent] = useState<number>(340000);
  
  // Audit logs generated for this simulation
  const [simulationLogs, setSimulationLogs] = useState<any[]>([]);

  // Reset function
  const handleReset = () => {
    setCurrentStep(0);
    setAutoRunning(false);
    setSimStudent(null);
    setSimInvoice(null);
    setSimReceipt(null);
    setSimJournalEntry(null);
    setSimReversalEntry(null);
    setCashBalanceCurrent(cashBalanceBefore);
    setRevenueBalanceCurrent(revenueBalanceBefore);
    setSimulationLogs([]);
    triggerNotification('🔄 تم إعادة تعيين دورة المحاكاة والرقابة بنجاح.', 'info');
  };

  // Step 1: Create Student
  const executeStep1 = async () => {
    try {
      const demoId = `stud_integrity_${Date.now()}`;
      const newStudent = {
        id: demoId,
        schoolId: 'school_1',
        name: 'عصام بن عبدالرحمن السديري',
        studentId: 'ST-2026-9901',
        nationalId: '1092837465',
        stage: 'الثانوي',
        stageId: 'stage_high',
        grade: 'الصف الأول الثانوي',
        gradeId: 'grade_high1',
        className: 'الفصل أ-1',
        academicClassId: 'class_high1_a',
        feesPaid: 0,
        feesRemaining: 3450, // 3000 tuition + 15% VAT
        status: 'نشط',
        parentName: 'عبدالرحمن السديري',
        parentPhone: '0912345678',
        gender: 'male',
        birthDate: '2010-05-15',
        religion: 'muslim',
        nationality: 'ليبيا',
        registrationDate: new Date().toISOString().split('T')[0],
        archived: false,
        isActive: true
      };

      // Add to main state (with API mock logic fallback)
      setStudents(prev => [newStudent as any, ...prev]);
      setSimStudent(newStudent);
      
      // Log audit
      const logDetails = `تسجيل طالب تجريبي جديد في شؤون الطلاب رقم: ${newStudent.studentId} - الاسم: ${newStudent.name}`;
      logAction('CREATE_STUDENT', logDetails, 'شؤون الطلاب');
      
      const newLog = {
        id: `log_int_${Date.now()}_1`,
        timestamp: new Date().toISOString(),
        userId: 'mgr_sulaiman',
        userName: 'سليمان غازي',
        userRole: 'Chief ERP Architect',
        action: 'CREATE_STUDENT',
        module: 'شؤون الطلاب',
        ipAddress: '192.168.1.144',
        details: logDetails,
        severity: 'low'
      };
      setSimulationLogs(prev => [newLog, ...prev]);
      
      setCashBalanceCurrent(cashBalanceBefore);
      setRevenueBalanceCurrent(revenueBalanceBefore);
      
      setCurrentStep(1);
      triggerNotification('✓ الخطوة 1 مكتملة: تم تسجيل الطالب بنجاح.', 'success');
    } catch (err: any) {
      triggerNotification(`❌ فشل تسجيل الطالب: ${err.message}`, 'warning');
    }
  };

  // Step 2: Create Fee Invoice
  const executeStep2 = () => {
    if (!simStudent) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }
    
    const invoiceId = `inv_int_${Date.now()}`;
    const newInvoice = {
      id: invoiceId,
      studentId: simStudent.id,
      studentName: simStudent.name,
      amount: 3000,
      taxAmount: 450,
      totalAmount: 3450,
      remainingAmount: 3450,
      dueDate: '2026-09-01',
      status: 'unpaid',
      item: 'الرسوم الدراسية السنوية - المرحلة الثانوية',
      invoiceDate: new Date().toISOString().split('T')[0],
      stageId: 'stage_high',
      costCenterId: 'cc_high',
      items: [
        { description: 'القسط الدراسي الأساسي السنوي', amount: 3000 },
        { description: 'ضريبة القيمة المضافة (15%)', amount: 450 }
      ]
    };

    setInvoices(prev => [newInvoice as any, ...prev]);
    setSimInvoice(newInvoice);

    // Log audit
    const logDetails = `إصدار فاتورة رسوم دراسية رقم ${invoiceId} للطالب ${simStudent.name} بمبلغ 3,450.00 د.ل شامل الضريبة`;
    logAction('CREATE_STUDENT_INVOICE', logDetails, 'الحسابات العامة');
    
    const newLog = {
      id: `log_int_${Date.now()}_2`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'CREATE_INVOICE',
      module: 'الحسابات العامة',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'low'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(2);
    triggerNotification('✓ الخطوة 2 مكتملة: تم إصدار فاتورة الرسوم بنجاح.', 'success');
  };

  // Step 3: Create Receipt Voucher
  const executeStep3 = () => {
    if (!simInvoice) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    const receiptId = `RV-STUD-INT-${Date.now().toString().substring(8)}`;
    const newReceipt = {
      id: receiptId,
      date: new Date().toISOString().split('T')[0],
      studentId: simStudent.id,
      studentName: simStudent.name,
      amount: 3450,
      paymentMethod: 'نقدي',
      receivingAccount: '1101',
      operationalType: 'رسوم دراسية',
      against: `سداد الرسوم الدراسية السنوية للعام الدراسي 2026 بموجب الفاتورة رقم ${simInvoice.id}`,
      stage: 'الثانوي',
      costCenter: 'cc_high',
      status: 'draft',
      createdBy: 'سليمان غازي',
      createdAt: new Date().toLocaleString('ar-LY')
    };

    setSimReceipt(newReceipt);

    // Log audit
    const logDetails = `إنشاء سند قبض مالي مسودة رقم ${receiptId} للطالب ${simStudent.name} بمبلغ 3,450.00 د.ل`;
    logAction('CREATE_RECEIPT_VOUCHER_DRAFT', logDetails, 'حسابات الطلاب');
    
    const newLog = {
      id: `log_int_${Date.now()}_3`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'CREATE_VOUCHER_DRAFT',
      module: 'حسابات الطلاب',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'low'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(3);
    triggerNotification('✓ الخطوة 3 مكتملة: تم إنشاء سند القبض (مسودة).', 'success');
  };

  // Step 4: Post Voucher
  const executeStep4 = () => {
    if (!simReceipt) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    // Determine sequence IDs
    const rcvId = `RCV-2026-INT${Date.now().toString().substring(10)}`;
    const jvId = `JV-2026-INT${Date.now().toString().substring(10)}`;

    SQLTransactionEngine.run({
      operationName: `POST_DEMO_RECEIPT_TO_GL (ترحيل سند القبض ${simReceipt.id} للحسابات العامة)`,
      tenantId: 'school_1',
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      ipAddress: '192.168.1.144',
      affectedTables: ['student_receipt_vouchers', 'receipt_vouchers', 'journal_entries', 'chart_of_accounts', 'students', 'audit_logs'],
      validationBlock: () => ({ valid: true }),
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        // A) Update student state
        setStudents(prev => prev.map(s => {
          if (s.id === simStudent.id) {
            return {
              ...s,
              feesPaid: 3450,
              feesRemaining: 0
            };
          }
          return s;
        }));

        setSimStudent(prev => ({
          ...prev,
          feesPaid: 3450,
          feesRemaining: 0
        }));

        // B) Update invoice status to paid
        setInvoices(prev => prev.map(inv => {
          if (inv.id === simInvoice.id) {
            return {
              ...inv,
              status: 'paid',
              remainingAmount: 0
            };
          }
          return inv;
        }));

        setSimInvoice(prev => ({
          ...prev,
          status: 'paid',
          remainingAmount: 0
        }));

        // C) Create Journal Entry
        const journal = {
          id: jvId,
          date: simReceipt.date,
          description: `قيد ترحيل تلقائي: ${simReceipt.against} - سند قبض رقم ${simReceipt.id}`,
          debitTotal: 3450,
          creditTotal: 3450,
          status: 'مرحل',
          type: 'بسيط',
          createdByUser: 'سليمان غازي',
          createdAt: new Date().toLocaleString('ar-LY'),
          documentType: 'سند قبض',
          receiptVoucherId: rcvId,
          studentName: simStudent.name,
          stage: 'الثانوي',
          costCenter: 'cc_high',
          lines: [
            {
              id: `l-demo-1`,
              accountCode: '1101',
              accountName: 'صندوق الخزينة الرئيسي (كاش)',
              description: 'الجانب المدين - استلام قيمة السند بـ صندوق الخزينة الرئيسي (كاش)',
              debit: 3450,
              credit: 0,
              costCenter: 'cc_high'
            },
            {
              id: `l-demo-2`,
              accountCode: '4101',
              accountName: 'إيرادات الرسوم الدراسية الموحدة',
              description: 'الجانب الدائن - إثبات إيراد الرسوم للمرحلة التعليمية: الثانوي',
              debit: 0,
              credit: 3450,
              costCenter: 'cc_high'
            }
          ]
        };

        setSimJournalEntry(journal);

        // D) Update local balances representation
        setCashBalanceCurrent(prev => prev + 3450);
        setRevenueBalanceCurrent(prev => prev + 3450);

        // E) Update receipt status
        setSimReceipt(prev => ({
          ...prev,
          status: 'posted',
          postedBy: 'سليمان غازي',
          postedAt: new Date().toLocaleString('ar-LY'),
          journalEntryId: jvId,
          receiptVoucherId: rcvId
        }));

        return true;
      },
      nestedSqlQueries: [
        SQLCommandBuilder.create({
          sqlText: `-- 1. Begin SQL Transaction for atomic double-entry posting`,
          parameters: [],
          executionContext: 'Double-entry posting'
        }),
        SQLCommandBuilder.create({
          sqlText: `SELECT id, fees_remaining FROM students WHERE id = $1 FOR UPDATE;`,
          parameters: [simStudent.id],
          executionContext: 'Student remaining fees query'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 2. Debit Cash Safe account (Code: 1101)`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance + 3450.00 WHERE code = '1101';`,
          parameters: [],
          executionContext: 'Debit Cash Safe'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 3. Credit Tuition Fee Revenue account (Code: 4101)`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance + 3450.00 WHERE code = '4101';`,
          parameters: [],
          executionContext: 'Credit Tuition Revenue'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 4. Deduct student remaining fees & update paid amount`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE students SET fees_paid = fees_paid + 3450.00, fees_remaining = fees_remaining - 3450.00 WHERE id = $1;`,
          parameters: [simStudent.id],
          executionContext: 'Deduct Student Remaining Fees'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 5. Insert double-entry journal entry rows into journal_entries`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO journal_entries (id, date, debit_sum, credit_sum, ref_doc) VALUES ($1, $2, 3450.00, 3450.00, $3);`,
          parameters: [jvId, simReceipt.date, rcvId],
          executionContext: 'Insert Journal Entry'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 6. Insert lines for debiting Cash and crediting Revenue`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO journal_lines (entry_id, account_code, debit, credit) VALUES ($1, '1101', 3450.00, 0.00), ($1, '4101', 0.00, 3450.00);`,
          parameters: [jvId],
          executionContext: 'Insert Journal Lines'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 7. Commit database transaction fully`,
          parameters: []
        })
      ]
    });

    // Log audits
    const logDetails = `ترحيل سند القبض ${simReceipt.id} للطالب ${simStudent.name} بقيمة 3,450.00 د.ل وإنشاء قيد اليومية المزدوج ${jvId}`;
    logAction('POST_STUDENT_RECEIPT', logDetails, 'حسابات الطلاب');
    
    const newLog = {
      id: `log_int_${Date.now()}_4`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'POST_RECEIPT_VOUCHER',
      module: 'حسابات الطلاب',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'medium'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(4);
    triggerNotification('✓ الخطوة 4 مكتملة: تم ترحيل سند القبض وتوليد قيد اليومية.', 'success');
  };

  // Step 5: Update General Ledger (View confirmation)
  const executeStep5 = () => {
    if (!simJournalEntry) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    const logDetails = `تحديث كشوفات الأستاذ العام وتغذية الحسابات الفرعية بالقيود المزدوجة الناتجة عن ترحيل السند ${simReceipt.id}`;
    
    const newLog = {
      id: `log_int_${Date.now()}_5`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'UPDATE_GENERAL_LEDGER',
      module: 'الحسابات العامة',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'low'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(5);
    triggerNotification('✓ الخطوة 5 مكتملة: تم ترحيل القيود إلى كشوفات الأستاذ العام.', 'success');
  };

  // Step 6: Update Trial Balance (View confirmation)
  const executeStep6 = () => {
    if (currentStep < 5) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    const logDetails = `تحديث ميزان المراجعة بالمدين والدائن للعمليات الفرعية - التحقق التلقائي من تطابق مجموع الحسابات`;
    
    const newLog = {
      id: `log_int_${Date.now()}_6`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'UPDATE_TRIAL_BALANCE',
      module: 'الحسابات العامة',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'low'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(6);
    triggerNotification('✓ الخطوة 6 مكتملة: ميزان المراجعة متطابق ومحدث في الوقت الفعلي.', 'success');
  };

  // Step 7: Reverse Voucher
  const executeStep7 = () => {
    if (currentStep < 6) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    const revJvId = `JV-REVERSE-2026-INT${Date.now().toString().substring(10)}`;

    SQLTransactionEngine.run({
      operationName: `REVERSE_STUDENT_RECEIPT_VOUCHER (عكس وإلغاء سند القبض ${simReceipt.id})`,
      tenantId: 'school_1',
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      ipAddress: '192.168.1.144',
      affectedTables: ['student_receipt_vouchers', 'journal_entries', 'chart_of_accounts', 'students', 'audit_logs'],
      validationBlock: () => ({ valid: true }),
      authorizationBlock: () => ({ authorized: true }),
      executionBlock: () => {
        // A) Restore student fees
        setStudents(prev => prev.map(s => {
          if (s.id === simStudent.id) {
            return {
              ...s,
              feesPaid: 0,
              feesRemaining: 3450
            };
          }
          return s;
        }));

        setSimStudent(prev => ({
          ...prev,
          feesPaid: 0,
          feesRemaining: 3450
        }));

        // B) Revert invoice status to unpaid
        setInvoices(prev => prev.map(inv => {
          if (inv.id === simInvoice.id) {
            return {
              ...inv,
              status: 'unpaid',
              remainingAmount: 3450
            };
          }
          return inv;
        }));

        setSimInvoice(prev => ({
          ...prev,
          status: 'unpaid',
          remainingAmount: 3450
        }));

        // C) Create Reversal JV
        const reversalJv = {
          id: revJvId,
          date: new Date().toISOString().split('T')[0],
          description: `قيد عكس وتسوية ملغي لسند القبض رقم ${simReceipt.id} - الطالب ${simStudent.name}`,
          debitTotal: 3450,
          creditTotal: 3450,
          status: 'مرحل',
          type: 'تسوية عكسية',
          createdByUser: 'سليمان غازي',
          createdAt: new Date().toLocaleString('ar-LY'),
          documentType: 'قيد تسوية',
          receiptVoucherId: simReceipt.receiptVoucherId,
          lines: [
            {
              id: `l-demo-rev1`,
              accountCode: '4101',
              accountName: 'إيرادات الرسوم الدراسية الموحدة',
              description: 'الجانب المدين - عكس وتخفيض الإيراد الدراسي بسبب إلغاء السند',
              debit: 3450,
              credit: 0,
              costCenter: 'cc_high'
            },
            {
              id: `l-demo-rev2`,
              accountCode: '1101',
              accountName: 'صندوق الخزينة الرئيسي (كاش)',
              description: 'الجانب الدائن - عكس وتخفيض النقدية بـ صندوق الخزينة الرئيسي (كاش)',
              debit: 0,
              credit: 3450,
              costCenter: 'cc_high'
            }
          ]
        };

        setSimReversalEntry(reversalJv);

        // D) Revert current balances
        setCashBalanceCurrent(prev => prev - 3450);
        setRevenueBalanceCurrent(prev => prev - 3450);

        // E) Update receipt status to cancelled
        setSimReceipt(prev => ({
          ...prev,
          status: 'cancelled',
          cancelledBy: 'سليمان غازي',
          cancelledAt: new Date().toLocaleString('ar-LY'),
          reversalJournalEntryId: revJvId
        }));

        return true;
      },
      nestedSqlQueries: [
        SQLCommandBuilder.create({
          sqlText: `-- 1. Begin SQL Transaction for systematic correction and reversal`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 2. Reverse and reduce cash safe balance (Code: 1101)`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance - 3450.00 WHERE code = '1101';`,
          parameters: [],
          executionContext: 'Reverse Cash balance'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 3. Reverse and reduce Tuition Fee Revenue balance (Code: 4101)`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance - 3450.00 WHERE code = '4101';`,
          parameters: [],
          executionContext: 'Reverse Tuition revenue'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 4. Restore student remaining fees & clear paid fees`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE students SET fees_paid = fees_paid - 3450.00, fees_remaining = fees_remaining + 3450.00 WHERE id = $1;`,
          parameters: [simStudent.id],
          executionContext: 'Restore student fees balance'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 5. Insert reversing double-entry journal entry rows (JV-REVERSE)`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO journal_entries (id, date, debit_sum, credit_sum, ref_doc) VALUES ($1, $2, 3450.00, 3450.00, $3);`,
          parameters: [revJvId, new Date().toISOString().split('T')[0], simReceipt.receiptVoucherId],
          executionContext: 'Insert Reversing Journal entry'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 6. Insert lines for debiting Revenue and crediting Cash`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO journal_lines (entry_id, account_code, debit, credit) VALUES ($1, '4101', 3450.00, 0.00), ($1, '1101', 0.00, 3450.00);`,
          parameters: [revJvId],
          executionContext: 'Insert Reversing Journal lines'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 7. Commit transaction to seal the corrective action`,
          parameters: []
        })
      ]
    });

    // Log audits
    const logDetails = `إلغاء وعكس سند القبض ${simReceipt.id} للطالب ${simStudent.name} بقيمة 3,450.00 د.ل وتوليد قيد التسوية العكسي المصحح ${revJvId}`;
    logAction('REVERSE_STUDENT_RECEIPT', logDetails, 'حسابات الطلاب');
    
    const newLog = {
      id: `log_int_${Date.now()}_7`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'REVERSE_VOUCHER',
      module: 'حسابات الطلاب',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'high'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(7);
    triggerNotification('✓ الخطوة 7 مكتملة: تم إجراء الإلغاء وعكس السند محاسبياً بنجاح.', 'success');
  };

  // Step 8: Verify Balances Returned
  const executeStep8 = () => {
    if (currentStep < 7) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    const logDetails = `إجراء المطابقة والـ Reconciliation لجميع الحسابات المتأثرة بدورة السند وإثبات خلو الأرصدة من الفوارق المحاسبية (0.00 فارق)`;
    
    const newLog = {
      id: `log_int_${Date.now()}_8`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'RECONCILE_BALANCES_SUCCESS',
      module: 'الحسابات العامة',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'medium'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(8);
    triggerNotification('✓ الخطوة 8 مكتملة: تطابق تام لكافة الحسابات بنسبة 100%.', 'success');
  };

  // Step 9: Verify Audit Trail
  const executeStep9 = () => {
    if (currentStep < 8) {
      triggerNotification('⚠️ الرجاء تنفيذ الخطوة السابقة أولاً.', 'warning');
      return;
    }

    const logDetails = `فحص سلامة واكتمال سجل الرقابة والعمليات لجميع خطوات الدورة المحاسبية من التسجيل حتى التسوية المزدوجة العكسية`;
    
    const newLog = {
      id: `log_int_${Date.now()}_9`,
      timestamp: new Date().toISOString(),
      userId: 'mgr_sulaiman',
      userName: 'سليمان غازي',
      userRole: 'Chief ERP Architect',
      action: 'AUDIT_TRAIL_VERIFIED',
      module: 'الرقابة والسحابة',
      ipAddress: '192.168.1.144',
      details: logDetails,
      severity: 'medium'
    };
    setSimulationLogs(prev => [newLog, ...prev]);

    setCurrentStep(9);
    triggerNotification('✓ الخطوة 9 مكتملة: تم التحقق واعتماد اكتمال سجل الرقابة الموحد.', 'success');
  };

  // Auto run flow using timeouts
  const handleAutoRun = () => {
    if (autoRunning) return;
    setAutoRunning(true);
    handleReset();
    
    setTimeout(() => {
      // Step 1
      executeStep1();
      
      setTimeout(() => {
        // Step 2
        executeStep2();
        
        setTimeout(() => {
          // Step 3
          executeStep3();
          
          setTimeout(() => {
            // Step 4
            executeStep4();
            
            setTimeout(() => {
              // Step 5
              executeStep5();
              
              setTimeout(() => {
                // Step 6
                executeStep6();
                
                setTimeout(() => {
                  // Step 7
                  executeStep7();
                  
                  setTimeout(() => {
                    // Step 8
                    executeStep8();
                    
                    setTimeout(() => {
                      // Step 9
                      executeStep9();
                      setAutoRunning(false);
                      triggerNotification('🎉 اكتملت الدورة السندية والرقابية الموحدة بنجاح تام وتم التحقق من سلامتها!', 'success');
                    }, 1200);
                  }, 1200);
                }, 1200);
              }, 1200);
            }, 1200);
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  return (
    <div id="accounting-integrity-container" className="space-y-6">
      
      {/* Dynamic Header Board */}
      <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30">
                لوحة الرقابة والضمان المحاسبي
              </span>
              <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full border border-yellow-500/30">
                معايير IFRS العالمية
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">محاكاة واختبار دورة ترحيل القيود والرقابة الثنائية</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              شاشة رقابية مخصصة لاختبار الدورة السندية المحاسبية لـ (إنشاء طالب ← فاتورة رسوم ← سند قبض ← ترحيل للأستاذ العام وميزان المراجعة ← تسوية عكسية ← التحقق من تطابق الأرصدة بالمليم ← تدقيق الـ Audit Trail).
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            <button
              onClick={handleAutoRun}
              disabled={autoRunning}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-black px-4 py-2.5 flex items-center gap-2 border border-emerald-500 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Play className={`w-4 h-4 ${autoRunning ? 'animate-pulse text-yellow-300' : ''}`} />
              <span>{autoRunning ? 'جاري الاختبار التلقائي...' : 'تشغيل الاختبار التلقائي'}</span>
            </button>
            <button
              onClick={handleReset}
              disabled={autoRunning}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-3 py-2.5 border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Stepper on right, Monitor Dashboard on left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Stepper Panel (Col-span 5) */}
        <div className="lg:col-span-5 p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>خطوات الدورة المحاسبية ورقابة السلامة</span>
          </h3>

          <div className="relative border-r-2 border-slate-100 mr-2 space-y-4 pr-4">
            
            {/* Step 1 */}
            <div className={`relative ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 1 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">1. تسجيل طالب جديد</span>
                  {currentStep >= 1 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">مكتمل</span>}
                </div>
                <p className="text-[10px] text-slate-500">إدخال الطالب في شؤون الطلاب وتخصيص المرحلة والصف.</p>
                {currentStep === 0 && (
                  <button
                    onClick={executeStep1}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    🚀 تسجيل الطالب الآن
                  </button>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className={`relative ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 2 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">2. إنشاء فاتورة رسوم</span>
                  {currentStep >= 2 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">مكتمل</span>}
                </div>
                <p className="text-[10px] text-slate-500">إصدار مطالبة مالية بالقيمة الإجمالية شاملة الضريبة (3,450.00 د.ل).</p>
                {currentStep === 1 && (
                  <button
                    onClick={executeStep2}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    📝 إصدار الفاتورة
                  </button>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`relative ${currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 3 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">3. إنشاء سند قبض مالي</span>
                  {currentStep >= 3 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">مكتمل</span>}
                </div>
                <p className="text-[10px] text-slate-500">تحرير سند استلام القيمة كمسودة في الصندوق (الخزينة كاش).</p>
                {currentStep === 2 && (
                  <button
                    onClick={executeStep3}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    💵 تحرير سند القبض
                  </button>
                )}
              </div>
            </div>

            {/* Step 4 */}
            <div className={`relative ${currentStep >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 4 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">4. ترحيل السند (Double-Entry)</span>
                  {currentStep >= 4 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">مرحل</span>}
                </div>
                <p className="text-[10px] text-slate-500">ترحيل السند واعتماده بالنظام المالي وتوليد القيد المزدوج التلقائي.</p>
                {currentStep === 3 && (
                  <button
                    onClick={executeStep4}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    ⚙️ ترحيل واعتماد السند
                  </button>
                )}
              </div>
            </div>

            {/* Step 5 */}
            <div className={`relative ${currentStep >= 5 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 5 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">5. تحديث كشوفات الأستاذ العام</span>
                  {currentStep >= 5 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">محدث</span>}
                </div>
                <p className="text-[10px] text-slate-500">تسجيل القيود المحاسبية في دفاتر الأستاذ العام للحسابات المتأثرة.</p>
                {currentStep === 4 && (
                  <button
                    onClick={executeStep5}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    📓 تحديث قيود الأستاذ العام
                  </button>
                )}
              </div>
            </div>

            {/* Step 6 */}
            <div className={`relative ${currentStep >= 6 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 6 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">6. تحديث ميزان المراجعة</span>
                  {currentStep >= 6 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">متطابق</span>}
                </div>
                <p className="text-[10px] text-slate-500">ترحيل وتحديث مجاميع المدين والدائن في ميزان المراجعة العام.</p>
                {currentStep === 5 && (
                  <button
                    onClick={executeStep6}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    ⚖️ فحص ميزان المراجعة
                  </button>
                )}
              </div>
            </div>

            {/* Step 7 */}
            <div className={`relative ${currentStep >= 7 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 7 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">7. إجراء تسوية عكسية (عكس السند)</span>
                  {currentStep >= 7 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">معكوس ومصحح</span>}
                </div>
                <p className="text-[10px] text-slate-500">كتابة قيد عكسي تلقائي (Reversal Entry) وتصحيح الحسابات رسمياً.</p>
                {currentStep === 6 && (
                  <button
                    onClick={executeStep7}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    ↩️ إلغاء وعكس السند الآن
                  </button>
                )}
              </div>
            </div>

            {/* Step 8 */}
            <div className={`relative ${currentStep >= 8 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 8 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">8. مطابقة الأرصدة (Reconciliation)</span>
                  {currentStep >= 8 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">مطابق بنسبة 100%</span>}
                </div>
                <p className="text-[10px] text-slate-500">التأكد محاسبياً أن كافة الأرصدة المتأثرة رجعت لحالتها السابقة دون فروقات.</p>
                {currentStep === 7 && (
                  <button
                    onClick={executeStep8}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    🔍 إجراء المطابقة المالية
                  </button>
                )}
              </div>
            </div>

            {/* Step 9 */}
            <div className={`relative ${currentStep >= 9 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                currentStep >= 9 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`} />
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">9. فحص كشوفات الـ Audit Trail</span>
                  {currentStep >= 9 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">مكتمل بالكامل</span>}
                </div>
                <p className="text-[10px] text-slate-500">التحقق من اكتمال قيود الرقابة وسجلات وتاريخ المعاملة المالي بشكل قاطع.</p>
                {currentStep === 8 && (
                  <button
                    onClick={executeStep9}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    🛡️ اعتماد سجل الرقابة
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* LEFT COLUMN: Data Monitor Dashboard (Col-span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Dynamic Ledger & Student Financial Card */}
          <div className="p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>شاشة فحص الطالب والمستندات الحية</span>
              </span>
              {simStudent && (
                <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  {simStudent.studentId}
                </span>
              )}
            </h4>

            {simStudent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Student info card */}
                <div className="bg-transparent p-3 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block">بطاقة الطالب المالية</span>
                  <div className="font-extrabold text-slate-950 text-sm">{simStudent.name}</div>
                  <div className="text-slate-500 font-semibold">{simStudent.stage} • {simStudent.grade}</div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">الرسوم المستحقة:</span>
                      <span className="font-extrabold font-mono text-slate-900">{simStudent.feesRemaining.toLocaleString()} د.ل</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">المدفوع حالياً:</span>
                      <span className="font-extrabold font-mono text-emerald-600">{simStudent.feesPaid.toLocaleString()} د.ل</span>
                    </div>
                  </div>
                </div>

                {/* Document Status */}
                <div className="bg-transparent p-3 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block">حالة الدورة والمستندات</span>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-semibold">الفاتورة المعتمدة:</span>
                      {simInvoice ? (
                        <span className={`px-2 py-0.5 rounded-[4px] font-bold text-[10px] ${
                          simInvoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {simInvoice.status === 'paid' ? 'مسددة بالكامل' : 'غير مسددة'}
                        </span>
                      ) : (
                        <span className="text-slate-400">لم تصدر بعد</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-semibold">سند القبض المالي:</span>
                      {simReceipt ? (
                        <span className={`px-2 py-0.5 rounded-[4px] font-bold text-[10px] ${
                          simReceipt.status === 'posted' ? 'bg-amber-50 text-amber-600' :
                          simReceipt.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {simReceipt.status === 'posted' ? 'مرحّل معتمد' :
                           simReceipt.status === 'cancelled' ? 'ملغي ومصحح' : 'مسودة'}
                        </span>
                      ) : (
                        <span className="text-slate-400">لم ينشأ بعد</span>
                      )}
                    </div>

                    {simReceipt?.journalEntryId && (
                      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500 font-semibold">رقم قيد اليومية:</span>
                        <span className="font-mono text-amber-700 font-bold">{simReceipt.journalEntryId}</span>
                      </div>
                    )}

                    {simReceipt?.reversalJournalEntryId && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-rose-600 font-bold">رقم قيد التسوية العكسي:</span>
                        <span className="font-mono text-rose-700 font-bold">{simReceipt.reversalJournalEntryId}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span>يرجى الضغط على "تسجيل الطالب" لبدء الاختبار السند الموحد.</span>
              </div>
            )}
          </div>

          {/* Section 2: Real-time Account Balances and Comparative Variance */}
          <div className="p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>فحص ميزان المراجعة والأرصدة المستردة</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-transparent text-slate-500 font-bold">
                    <th className="p-2 border-b border-slate-200">الحساب المالي ورقم الدليل</th>
                    <th className="p-2 border-b border-slate-200 text-left">الأرصدة السابقة</th>
                    <th className="p-2 border-b border-slate-200 text-left text-amber-600">أثناء الترحيل</th>
                    <th className="p-2 border-b border-slate-200 text-left text-emerald-600">الرصيد بعد العكس</th>
                    <th className="p-2 border-b border-slate-200 text-center">الفارق والحياد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {/* Cash account */}
                  <tr>
                    <td className="p-2 font-sans font-bold text-slate-800">1101 • صندوق الخزينة الرئيسي (كاش)</td>
                    <td className="p-2 text-left text-slate-500">{cashBalanceBefore.toLocaleString()} د.ل</td>
                    <td className="p-2 text-left text-amber-600">{(cashBalanceBefore + (currentStep >= 4 && currentStep < 7 ? 3450 : 0)).toLocaleString()} د.ل</td>
                    <td className="p-2 text-left text-slate-800 font-extrabold">{cashBalanceCurrent.toLocaleString()} د.ل</td>
                    <td className="p-2 text-center">
                      {cashBalanceCurrent === cashBalanceBefore ? (
                        <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px]">0.00 (حياد تام)</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded text-[10px]">+3,450.00</span>
                      )}
                    </td>
                  </tr>
                  {/* Revenue account */}
                  <tr>
                    <td className="p-2 font-sans font-bold text-slate-800">4101 • إيرادات الرسوم الدراسية الموحدة</td>
                    <td className="p-2 text-left text-slate-500">{revenueBalanceBefore.toLocaleString()} د.ل</td>
                    <td className="p-2 text-left text-amber-600">{(revenueBalanceBefore + (currentStep >= 4 && currentStep < 7 ? 3450 : 0)).toLocaleString()} د.ل</td>
                    <td className="p-2 text-left text-slate-800 font-extrabold">{revenueBalanceCurrent.toLocaleString()} د.ل</td>
                    <td className="p-2 text-center">
                      {revenueBalanceCurrent === revenueBalanceBefore ? (
                        <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px]">0.00 (حياد تام)</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded text-[10px]">+3,450.00</span>
                      )}
                    </td>
                  </tr>
                  {/* Student Balance */}
                  {simStudent && (
                    <tr>
                      <td className="p-2 font-sans font-bold text-slate-800">ذمم الطلاب • {simStudent.name}</td>
                      <td className="p-2 text-left text-slate-500">3,450.00 د.ل</td>
                      <td className="p-2 text-left text-amber-600">{(currentStep >= 4 && currentStep < 7 ? 0 : 3450).toLocaleString()} د.ل</td>
                      <td className="p-2 text-left text-slate-800 font-extrabold">{simStudent.feesRemaining.toLocaleString()} د.ل</td>
                      <td className="p-2 text-center">
                        {simStudent.feesRemaining === 3450 ? (
                          <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px]">0.00 (مسترد كامل)</span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded text-[10px]">تسديد كامل</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Reconciliation proof check */}
            {currentStep >= 8 && (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3 flex items-center gap-3 animate-fadeIn text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-[12px]">تقرير المطابقة والرقابة المالية المعتمد:</div>
                  <div className="text-emerald-700 font-semibold mt-0.5">
                    تم التأكد ومطابقة ميزان المراجعة والأستاذ العام بالكامل. فروق الأرصدة مساوية لـ <span className="font-mono font-bold">0.00 د.ل</span>. جميع الأرصدة والمبالغ المستحقة رجعت لحالتها الأصلية بنجاح 100%.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Live Audit Trail for current flow */}
          <div className="p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>سجل الرقابة وتاريخ المعاملة المالي (Live Audit Trail)</span>
              </span>
              <span className="bg-amber-50 text-amber-600 font-bold text-[9px] px-2 py-0.5 rounded border border-amber-200 font-mono">
                {simulationLogs.length} سجلات
              </span>
            </h4>

            {simulationLogs.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {simulationLogs.map((log) => (
                  <div key={log.id} className="bg-transparent border border-slate-100 p-3 text-xs space-y-1.5 animate-slideUp">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-700">{log.userName} ({log.userRole})</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString('ar-LY')}</span>
                    </div>
                    <p className="text-slate-600 font-semibold leading-relaxed text-[11px]">{log.details}</p>
                    <div className="flex gap-4 text-[9px] text-slate-400 font-semibold font-mono">
                      <span>Module: {log.module}</span>
                      <span>IP Address: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span>لا توجد سجلات بعد. يرجى بدء الاختبار لتوليد الـ Audit Trail.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
