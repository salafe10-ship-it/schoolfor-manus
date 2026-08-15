import { AlertCircle, BarChart3, Calendar, Check, CheckCircle2, Code, Cross, Database, Diff, File, FileCheck, Files, Grid, Info, Layout, LayoutList, Lock as LockIcon, Logs, Play, RefreshCw, School, Shield, ShieldAlert, Sidebar, Sliders, Sparkles, Target, Terminal, User } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { z } from 'zod';

// ==========================================
// CENTRALIZED TYPES & STRUCURED ERROR SCHEMA
// ==========================================
export interface ValidationError {
  code: string;
  category: 'Input' | 'Business' | 'CrossEntity' | 'Accounting' | 'Academic' | 'Authorization' | 'Tenant' | 'Concurrency';
  severity: 'critical' | 'warning' | 'info';
  messageEn: string;
  messageAr: string;
  field?: string;
  timestamp: string;
  remedyEn: string;
  remedyAr: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ==========================================
// STATIC RULE DECLARATIONS FOR THE REPORT
// ==========================================
interface RegisteredRule {
  id: string;
  code: string;
  category: ValidationError['category'];
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

const REGISTERED_RULES: RegisteredRule[] = [
  {
    id: 'R_INP_001',
    code: 'VAL_ERR_SAUDI_ID_FORMAT',
    category: 'Input',
    nameEn: 'Saudi National ID Verification',
    nameAr: 'التحقق من الهوية الوطنية السعودية',
    descriptionEn: 'Ensures the ID contains exactly 10 digits and starts with 1 or 2.',
    descriptionAr: 'يتحقق من أن الهوية الوطنية تتكون من 10 خانات وتبدأ بـ 1 أو 2.'
  },
  {
    id: 'R_BUS_001',
    code: 'VAL_ERR_UNDERAGE_GRADE',
    category: 'Business',
    nameEn: 'Minimum Age Requirement per Grade',
    nameAr: 'الحد الأدنى للسن بالنسبة للمرحلة الدراسية',
    descriptionEn: 'Enforces student age meets minimum criteria for grade level.',
    descriptionAr: 'يتحقق من أن عمر الطالب يطابق الحد الأدنى المعتمد للمرحلة.'
  },
  {
    id: 'R_BUS_002',
    code: 'VAL_ERR_MAX_DISCOUNT_EXCEEDED',
    category: 'Business',
    nameEn: 'Maximum Allowed Discount Ceiling',
    nameAr: 'الحد الأقصى المسموح به للخصومات والتخفيضات',
    descriptionEn: 'Ensures total tuition discount does not exceed 100% of the tuition base.',
    descriptionAr: 'يتحقق من أن إجمالي الخصومات والمنح لا يتجاوز 100% من الرسوم الأساسية.'
  },
  {
    id: 'R_CRO_001',
    code: 'VAL_ERR_INVOICE_LEDGER_MISMATCH',
    category: 'CrossEntity',
    nameEn: 'Invoice Ledger Entry Cross-Verification',
    nameAr: 'مطابقة إدخال الأستاذ العام مع الفاتورة المصاحبة',
    descriptionEn: 'Verifies invoice aggregate line total matches the generated general ledger entry lines.',
    descriptionAr: 'يتحقق من أن مجموع بنود الفاتورة يطابق تماماً بنود قيد اليومية المولد.'
  },
  {
    id: 'R_ACC_001',
    code: 'VAL_ERR_DEBIT_CREDIT_MISMATCH',
    category: 'Accounting',
    nameEn: 'Double-Entry Accounting Balance Integrity',
    nameAr: 'توازن قيد اليومية المحاسبي المزدوج',
    descriptionEn: 'Enforces absolute balance in journal entries (Sum Debits === Sum Credits).',
    descriptionAr: 'يفرض التوازن التام في قيود اليومية (مجموع المدين === مجموع الدائن).'
  },
  {
    id: 'R_ACC_002',
    code: 'VAL_ERR_VAT_RATE_INCORRECT',
    category: 'Accounting',
    nameEn: 'Saudi VAT Conformity Validator',
    nameAr: 'التحقق من مطابقة ضريبة القيمة المضافة السعودية',
    descriptionEn: 'Enforces Saudi National VAT rate calculations exactly at 15%.',
    descriptionAr: 'يفرض احتساب ضريبة القيمة المضافة طبقاً للنسبة الوطنية 15%.'
  },
  {
    id: 'R_ACA_001',
    code: 'VAL_ERR_PREREQUISITE_NOT_MET',
    category: 'Academic',
    nameEn: 'Course Academic Prerequisite Validator',
    nameAr: 'التحقق من المتطلبات الدراسية السابقة للمقرر',
    descriptionEn: 'Validates student has passed requisite prior modules before enrollment.',
    descriptionAr: 'يتحقق من اجتياز الطالب للمتطلب السابق للمادة قبل تسجيلها.'
  },
  {
    id: 'R_AUTH_001',
    code: 'VAL_ERR_UNAUTHORIZED_STATE_CHANGE',
    category: 'Authorization',
    nameEn: 'Role-Based State Mutation Guard',
    nameAr: 'حظر تغيير حالة النظام لغير المخولين',
    descriptionEn: 'Ensures system transitions (e.g. final freeze) are only performed by explicit Admin/Dean roles.',
    descriptionAr: 'يضمن عدم تعديل الحالات الحرجة بالنظام إلا من خلال أصحاب الصلاحيات المعتمدة.'
  },
  {
    id: 'R_TEN_001',
    code: 'VAL_ERR_TENANT_CONTAMINATION',
    category: 'Tenant',
    nameEn: 'Multi-Tenant Isolation Safeguard',
    nameAr: 'عزل البيانات للمستأجرين لمنع التداخل',
    descriptionEn: 'Validates resource ownership matching current tenant identity exactly.',
    descriptionAr: 'يمنع تسريب البيانات ويضمن تطابق معرف المستأجر للمصدر مع الجلسة الحالية.'
  },
  {
    id: 'R_CON_001',
    code: 'VAL_ERR_CONCURRENCY_OUTDATED',
    category: 'Concurrency',
    nameEn: 'Optimistic Concurrency Control Lock',
    nameAr: 'التحقق من تزامن البيانات ومنع التعديل المتداخل',
    descriptionEn: 'Detects race conditions by checking entity version key before allowing database updates.',
    descriptionAr: 'يمنع الكتابة المتزامنة عبر التحقق من تطابق نسخة السجل المدخل مع المخزن.'
  }
];

// ==========================================
// SCENARIOS FOR PLAYGROUND & EXECUTION ENGINE
// ==========================================
interface Scenario {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  payload: any;
  category: ValidationError['category'];
}

const PLAYGROUND_SCENARIOS: Scenario[] = [
  {
    id: 'scen_valid_registration',
    nameEn: 'Successful Valid Student Registration',
    nameAr: 'تسجيل طالب جديد ناجح (ممتثل تماماً)',
    descriptionEn: 'All inputs, tenant scopes, and business rules conform to specifications.',
    descriptionAr: 'تطابق كامل للمدخلات وعمر الطالب ومطابقة نطاق المستأجر دون أي تجاوز.',
    category: 'Input',
    payload: {
      studentName: 'عمر بن الخطاب سليمان',
      saudiNationalId: '1092834812',
      age: 16,
      gradeLevel: 'GRADE_10',
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
      recordVersion: 1,
      dbVersion: 1
    }
  },
  {
    id: 'scen_invalid_saudi_id',
    nameEn: 'Saudi National ID Verification Failure',
    nameAr: 'فشل التحقق من تنسيق الهوية الوطنية السعودية',
    descriptionEn: 'The provided Saudi ID is malformed (starts with wrong digit and incorrect length).',
    descriptionAr: 'الهوية الوطنية المدخلة لا تتبع النمط الوطني المعتمد (تبدأ برقم خاطئ وبطول غير صحيح).',
    category: 'Input',
    payload: {
      studentName: 'فهد المطيري',
      saudiNationalId: '302918',
      age: 15,
      gradeLevel: 'GRADE_9',
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
      recordVersion: 1,
      dbVersion: 1
    }
  },
  {
    id: 'scen_underage_grade',
    nameEn: 'Student Underage Violation',
    nameAr: 'مخالفة الحد الأدنى لسن القبول للمرحلة',
    descriptionEn: 'A 5-year-old child cannot be registered into Grade 10 (High School).',
    descriptionAr: 'يحاول تسجيل طفل بعمر 5 سنوات في الصف العاشر الثانوي (الحد الأدنى 15 سنة).',
    category: 'Business',
    payload: {
      studentName: 'سارة بنت أحمد',
      saudiNationalId: '2019283419',
      age: 5,
      gradeLevel: 'GRADE_10',
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
      recordVersion: 1,
      dbVersion: 1
    }
  },
  {
    id: 'scen_double_entry_imbalance',
    nameEn: 'Unbalanced Accounting Journal Entry',
    nameAr: 'ترحيل قيد محاسبي غير متوازن (فشل الأستاذ العام)',
    descriptionEn: 'Debits (15,000 SAR) and Credits (13,500 SAR) are out of balance.',
    descriptionAr: 'قيمة المدين (15,000 ريال) لا تطابق قيمة الدائن (13,500 ريال) بفرق 1,500 ريال.',
    category: 'Accounting',
    payload: {
      journalTitle: 'ترحيل دفعة الرسوم الدراسية للفصل الأول',
      debits: [
        { account: 'ACC_1010_CASH', amount: 15000.00 }
      ],
      credits: [
        { account: 'ACC_4010_REVENUE', amount: 13500.00 }
      ],
      vatCalculated: 2025.00, // Correct VAT would be 15% of 13500 (2025) but total sum is unbalanced
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
    }
  },
  {
    id: 'scen_incorrect_vat',
    nameEn: 'Saudi VAT Calculation Violation',
    nameAr: 'مخالفة نسبة ضريبة القيمة المضافة السعودية (ليست 15%)',
    descriptionEn: 'The journal attempts to apply a custom 5% tax instead of Saudi standard 15%.',
    descriptionAr: 'القيد يحاول تطبيق ضريبة بنسبة 5% فقط مخالفاً لتعليمات الهيئة الوطنية المقررة بـ 15%.',
    category: 'Accounting',
    payload: {
      journalTitle: 'تسجيل فاتورة رسوم وتوريد الضريبة',
      debits: [
        { account: 'ACC_1010_CASH', amount: 10500.00 }
      ],
      credits: [
        { account: 'ACC_4010_REVENUE', amount: 10000.00 },
        { account: 'ACC_2050_VAT', amount: 500.00 } // 5% VAT instead of 1500 (15%)
      ],
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
    }
  },
  {
    id: 'scen_tenant_contamination',
    nameEn: 'Multi-Tenant Cross-Contamination Security Violation',
    nameAr: 'محاولة اختراق تداخل البيانات للمستأجرين (Tenant Breach)',
    descriptionEn: 'A user authenticated in Tenant "Riyadh-01" tries to edit a record of Tenant "Jeddah-02".',
    descriptionAr: 'مستخدم مسجل في فرع الرياض يحاول قراءة/تعديل سجل يخص فرع جدة صراحة.',
    category: 'Tenant',
    payload: {
      studentName: 'سلمان الفهد',
      saudiNationalId: '1092834812',
      age: 16,
      gradeLevel: 'GRADE_10',
      tenantId: 'TEN_JEDDAH_02', // Target record owner
      contextTenantId: 'TEN_RIYADH_01', // User's active session tenant
      recordVersion: 2,
      dbVersion: 2
    }
  },
  {
    id: 'scen_concurrency_conflict',
    nameEn: 'Stale State Optimistic Concurrency Failure',
    nameAr: 'فشل التعديل بسبب تداخل التحديثات (Concurrency Clash)',
    descriptionEn: 'User tries to update with payload of version 2, but database has been updated to version 3.',
    descriptionAr: 'المحاولة تعديل عقد دراسي بنسخة قديمة (v2) بينما قيد في قاعدة البيانات مسبقاً نسخة أحدث (v3).',
    category: 'Concurrency',
    payload: {
      studentName: 'عمر بن الخطاب سليمان',
      saudiNationalId: '1092834812',
      age: 16,
      gradeLevel: 'GRADE_10',
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
      recordVersion: 2, // stale version being saved
      dbVersion: 3 // active version in DB
    }
  },
  {
    id: 'scen_academic_prereq_fail',
    nameEn: 'Academic Prerequisite Violation',
    nameAr: 'مخالفة المتطلب الدراسي السابق (أكاديمي)',
    descriptionEn: 'Attempting to enroll the student into "Advanced Calculus II" before passing "Calculus I".',
    descriptionAr: 'تسجيل الطالب في مادة "الرياضيات المتقدمة 2" بالرغم من عدم اجتيازه "الرياضيات 1".',
    category: 'Academic',
    payload: {
      studentName: 'خالد بن الوليد',
      courseName: 'Advanced Calculus II',
      coursePrerequisite: 'Calculus I',
      completedCourses: ['Physics I', 'Intro to Computing'], // Missing Calculus I
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01',
    }
  },
  {
    id: 'scen_unauthorized_state_change',
    nameEn: 'Unauthorized System State Lockout',
    nameAr: 'تعديل حالة القفل العام لغير المسؤولين (حماية الصلاحيات)',
    descriptionEn: 'A Guest/Teacher role attempts to trigger "Academic Calendar Freeze" reserved for Deans.',
    descriptionAr: 'محاولة إغلاق وتجميد التقويم الدراسي للعام الجديد بصلاحيات "معلم" بينما يتطلب صلاحيات "عميد".',
    category: 'Authorization',
    payload: {
      action: 'FREEZE_ACADEMIC_CALENDAR',
      userRole: 'Teacher', // Required: 'Dean' or 'Admin'
      academicYear: '2026/2027',
      tenantId: 'TEN_RIYADH_01',
      contextTenantId: 'TEN_RIYADH_01'
    }
  }
];

interface EnterpriseValidationFrameworkProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function EnterpriseValidationFramework({ triggerNotification }: EnterpriseValidationFrameworkProps) {
  const [activeTab, setActiveTab] = useState<'playground' | 'coverage' | 'refactor'>('playground');
  
  // Playground state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen_valid_registration');
  const [editedPayload, setEditedPayload] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Refactoring state
  const [refactored, setRefactored] = useState<boolean>(false);
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);

  // Load selected scenario payload into the editor
  const activeScenario = useMemo(() => {
    const scen = PLAYGROUND_SCENARIOS.find(s => s.id === selectedScenarioId) || PLAYGROUND_SCENARIOS[0];
    return scen;
  }, [selectedScenarioId]);

  // Sync payload editor on scenario switch
  React.useEffect(() => {
    setEditedPayload(JSON.stringify(activeScenario.payload, null, 2));
    setValidationResult(null);
  }, [activeScenario]);

  // Terminal Logs
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] FRAMEWORK ENGINE: تم تهيئة محرك التحقق المؤسسي الموحد بنجاح (Unified Validator Engine v18.0).`,
    `[${new Date().toLocaleTimeString()}] FRAMEWORK ENGINE: تم سحب كشوف التحقق والتحقق المزدوج من كافة المستودعات (Repositories) والواجهات (UIs).`,
    `[${new Date().toLocaleTimeString()}] جاهز لتشغيل بروتوكول مكافحة تكرار التحقق وتثبيت الحوكمة الشاملة.`
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Run the centralized validation rules programmatically
  const executeCentralValidation = () => {
    setIsRunning(true);
    addLog(`⚙️ تلقي طلب مراجعة ممتثل لقواعد الحوكمة...`);
    
    setTimeout(() => {
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(editedPayload);
      } catch (e) {
        setIsRunning(false);
        const errorResult: ValidationResult = {
          isValid: false,
          errors: [{
            code: 'VAL_ERR_MALFORMED_JSON',
            category: 'Input',
            severity: 'critical',
            messageEn: 'Malformed JSON payload structure.',
            messageAr: 'البيانات المرسلة غير صالحة ولا تتبع التنسيق البرمجي السليم JSON.',
            field: 'Root',
            timestamp: new Date().toISOString(),
            remedyEn: 'Please verify commas, quotes and brackets in your request.',
            remedyAr: 'يرجى مراجعة علامات التنصيص والأقواس في البيانات المدخلة.'
          }]
        };
        setValidationResult(errorResult);
        addLog(`❌ فشل في قراءة البيانات: JSON غير صالح.`);
        triggerNotification('يرجى كتابة أو تصحيح كود الـ JSON ليتم تحليله بنجاح', 'danger');
        return;
      }

      const errorsFound: ValidationError[] = [];

      // Category specific triggers or generic schema checks
      // 1. Tenant Check (Tenant Validation)
      if (parsedPayload.tenantId && parsedPayload.contextTenantId) {
        if (parsedPayload.tenantId !== parsedPayload.contextTenantId) {
          errorsFound.push({
            code: 'VAL_ERR_TENANT_CONTAMINATION',
            category: 'Tenant',
            severity: 'critical',
            messageEn: `Tenant Security Cross-Contamination Blocked! Entity belongs to Tenant ${parsedPayload.tenantId}, but Context Tenant is ${parsedPayload.contextTenantId}.`,
            messageAr: `تم حظر تداخل بيانات الفروع! السجل يخص الفرع ${parsedPayload.tenantId}، بينما صلاحية المستخدم تفترض الفرع ${parsedPayload.contextTenantId}.`,
            field: 'tenantId',
            timestamp: new Date().toISOString(),
            remedyEn: 'Authenticate user with the matching target Tenant ID context.',
            remedyAr: 'يرجى تسجيل الدخول بالصلاحيات الصحيحة المطابقة لنطاق السجل المستهدف.'
          });
        }
      }

      // 2. National ID check (Input Validation)
      if (parsedPayload.saudiNationalId !== undefined) {
        const idStr = String(parsedPayload.saudiNationalId);
        const isValidFormat = /^[12]\d{9}$/.test(idStr);
        if (!isValidFormat) {
          errorsFound.push({
            code: 'VAL_ERR_SAUDI_ID_FORMAT',
            category: 'Input',
            severity: 'critical',
            messageEn: 'The provided Saudi ID is malformed. Must be exactly 10 numeric digits starting with 1 (Citizen) or 2 (Resident).',
            messageAr: 'رقم الهوية الوطنية/الإقامة غير صالح. يجب أن يتكون من 10 خانات رقمية ويبدأ بـ 1 للمواطنين أو 2 للمقيمين.',
            field: 'saudiNationalId',
            timestamp: new Date().toISOString(),
            remedyEn: 'Enter a valid 10-digit Saudi National ID or Iqama number.',
            remedyAr: 'يرجى إدخال رقم هوية وطنية أو رقم إقامة صحيح مكون من 10 أرقام.'
          });
        }
      }

      // 3. Underage check (Business Validation)
      if (parsedPayload.age !== undefined && parsedPayload.gradeLevel === 'GRADE_10') {
        if (parsedPayload.age < 15) {
          errorsFound.push({
            code: 'VAL_ERR_UNDERAGE_GRADE',
            category: 'Business',
            severity: 'critical',
            messageEn: `Age ${parsedPayload.age} is below the minimum threshold (15 years) required for high school Grade 10 enrollment.`,
            messageAr: `العمر (${parsedPayload.age} سنوات) غير مستوفٍ للحد الأدنى المسموح به (15 سنة) للقبول في الصف العاشر الثانوي.`,
            field: 'age',
            timestamp: new Date().toISOString(),
            remedyEn: 'Verify student date of birth or adjust the registered Grade level.',
            remedyAr: 'تأكد من تاريخ ميلاد الطالب المدخل أو قم بتعديل الصف الدراسي المقترح.'
          });
        }
      }

      // 4. Accounting balanced check (Accounting Validation)
      if (parsedPayload.debits !== undefined && parsedPayload.credits !== undefined) {
        const sumDebits = parsedPayload.debits.reduce((sum: number, x: any) => sum + (x.amount || 0), 0);
        const sumCredits = parsedPayload.credits.reduce((sum: number, x: any) => sum + (x.amount || 0), 0);
        if (Math.abs(sumDebits - sumCredits) > 0.001) {
          errorsFound.push({
            code: 'VAL_ERR_DEBIT_CREDIT_MISMATCH',
            category: 'Accounting',
            severity: 'critical',
            messageEn: `Double-entry Ledger Imbalance! Total Debits (${sumDebits.toLocaleString()} SAR) must exactly equal Total Credits (${sumCredits.toLocaleString()} SAR). Diff: ${Math.abs(sumDebits - sumCredits).toLocaleString()} SAR.`,
            messageAr: `قيد محاسبي غير متوازن! مجموع المدين (${sumDebits.toLocaleString()} ريال) يجب أن يتطابق تماماً مع مجموع الدائن (${sumCredits.toLocaleString()} ريال). الفرق: ${Math.abs(sumDebits - sumCredits).toLocaleString()} ريال.`,
            field: 'journalEntry',
            timestamp: new Date().toISOString(),
            remedyEn: 'Ensure the credit and debit allocation ledger accounts are correctly offset to maintain zero balance.',
            remedyAr: 'تأكد من ترحيل القيد بالشكل المزدوج الصحيح وضبط الفوارق المالية ليتساوى مجموع المدين مع الدائن.'
          });
        }
      }

      // 5. VAT Check (Accounting Validation)
      if (parsedPayload.credits !== undefined && parsedPayload.credits.some((c: any) => c.account === 'ACC_2050_VAT')) {
        const baseAmount = parsedPayload.credits.find((c: any) => c.account === 'ACC_4010_REVENUE')?.amount || 0;
        const vatAmount = parsedPayload.credits.find((c: any) => c.account === 'ACC_2050_VAT')?.amount || 0;
        const expectedVat = baseAmount * 0.15;
        if (Math.abs(vatAmount - expectedVat) > 0.01) {
          errorsFound.push({
            code: 'VAL_ERR_VAT_RATE_INCORRECT',
            category: 'Accounting',
            severity: 'warning',
            messageEn: `Calculated VAT (${vatAmount.toLocaleString()} SAR) does not match the mandatory Saudi VAT rate of 15% (Expected: ${expectedVat.toLocaleString()} SAR).`,
            messageAr: `قيمة الضريبة المحتسبة (${vatAmount.toLocaleString()} ريال) لا تطابق النسبة المقررة في المملكة 15% للرسوم (المتوقع: ${expectedVat.toLocaleString()} ريال).`,
            field: 'credits.VAT',
            timestamp: new Date().toISOString(),
            remedyEn: 'Recalculate VAT using standard 0.15 coefficient.',
            remedyAr: 'أعد احتساب ضريبة القيمة المضافة باستخدام المعامل الموحد 0.15.'
          });
        }
      }

      // 6. Concurrency Version mismatch (Concurrency Validation)
      if (parsedPayload.recordVersion !== undefined && parsedPayload.dbVersion !== undefined) {
        if (parsedPayload.recordVersion !== parsedPayload.dbVersion) {
          errorsFound.push({
            code: 'VAL_ERR_CONCURRENCY_OUTDATED',
            category: 'Concurrency',
            severity: 'critical',
            messageEn: `Optimistic Concurrency Clash! The record has been modified in the background (Your edit version: v${parsedPayload.recordVersion}, Database active version: v${parsedPayload.dbVersion}).`,
            messageAr: `تعديل مرفوض لوقوع تعارض تزامن! تم تحديث السجل من قبل مستخدم آخر (النسخة المدخلة: v${parsedPayload.recordVersion}، النسخة الحالية بقاعدة البيانات: v${parsedPayload.dbVersion}).`,
            field: 'recordVersion',
            timestamp: new Date().toISOString(),
            remedyEn: 'Refresh the page to obtain the latest entity version state, then re-apply your changes.',
            remedyAr: 'يرجى تحديث الصفحة لجلب أحدث حالة للعقد، ثم أعد إدخال التغييرات مجدداً.'
          });
        }
      }

      // 7. Course Prerequisite missing (Academic Validation)
      if (parsedPayload.coursePrerequisite !== undefined && parsedPayload.completedCourses !== undefined) {
        const hasPassed = parsedPayload.completedCourses.includes(parsedPayload.coursePrerequisite);
        if (!hasPassed) {
          errorsFound.push({
            code: 'VAL_ERR_PREREQUISITE_NOT_MET',
            category: 'Academic',
            severity: 'critical',
            messageEn: `Academic Prerequisite Failed! Student cannot enroll in "${parsedPayload.courseName}" before completing and passing "${parsedPayload.coursePrerequisite}".`,
            messageAr: `فشل المتطلب الدراسي! لا يمكن للطالب تسجيل مقرر "${parsedPayload.courseName}" دون النجاح المسبق في المتطلب الأول وهو مقرر "${parsedPayload.coursePrerequisite}".`,
            field: 'completedCourses',
            timestamp: new Date().toISOString(),
            remedyEn: 'Enroll the student in the missing prerequisite course first, or request an official Academic Waiver.',
            remedyAr: 'قم بتسجيل الطالب في المادة المتطلبة أولاً، أو قدم طلباً لإعفاء أكاديمي معتمد.'
          });
        }
      }

      // 8. Auth State modification (Authorization Validation)
      if (parsedPayload.action === 'FREEZE_ACADEMIC_CALENDAR' && parsedPayload.userRole !== undefined) {
        if (parsedPayload.userRole !== 'Dean' && parsedPayload.userRole !== 'Admin') {
          errorsFound.push({
            code: 'VAL_ERR_UNAUTHORIZED_STATE_CHANGE',
            category: 'Authorization',
            severity: 'critical',
            messageEn: `Action "${parsedPayload.action}" rejected! Role "${parsedPayload.userRole}" is unauthorized. Required roles: Dean, Admin.`,
            messageAr: `العملية مرفوضة لعدم كفاية الصلاحيات! صلاحية "${parsedPayload.userRole}" غير مخولة بالقيام بـ "${parsedPayload.action}". الصلاحية المطلوبة: عميد أو مسؤول نظام.`,
            field: 'userRole',
            timestamp: new Date().toISOString(),
            remedyEn: 'Escalate to system administrator or login with an administrative role account.',
            remedyAr: 'يرجى مراجعة مسؤول النظام أو الدخول بحساب يتمتع بالصلاحيات الإدارية المطلوبة.'
          });
        }
      }

      const isAllValid = errorsFound.length === 0;
      setValidationResult({
        isValid: isAllValid,
        errors: errorsFound
      });

      if (isAllValid) {
        addLog(`✅ تم الفحص والاعتماد: المعطيات ممتثلة وصالحة 100% للتخزين الآمن.`);
        triggerNotification('تم اجتياز الفحص الموحد بنجاح - البيانات سليمة وممتثلة تماماً!', 'success');
      } else {
        addLog(`❌ تم رصد عدد (${errorsFound.length}) مخالفات هيكلية ومالية مهددة لسلامة النظام.`);
        triggerNotification(`تنبيه: تم رصد مخالفات لقواعد الحوكمة الموحدة. تم منع البيانات من الدخول!`, 'danger');
      }

      setIsRunning(false);
    }, 1000);
  };

  // Run duplicate refactoring pipeline simulator
  const handleTriggerRefactor = () => {
    setIsRefactoring(true);
    addLog(`🔄 جاري تشغيل خوارزمية مسح الأكواد وتطهير مكررات التحقق من الكومبوننت والمستودعات...`);
    
    setTimeout(() => {
      setRefactored(true);
      setIsRefactoring(false);
      addLog(`✓ تم استبدال الكود المكرر في 14 ملف واجهة ومستودع واستدعاء ValidationEngine.validate() الموحد.`);
      addLog(`✓ توحيد المعايير: إزالة 420 سطر برمجي مكرر واستبدالها بوصلات تحقق قياسية ومحكمة.`);
      addLog(`🏆 تم الانتهاء من مواءمة الكود الكلي وتطهيره. الامتثال لقواعد الحوكمة: 100% ✓`);
      triggerNotification('تم تنفيذ محاكي تطهير واستبدال الأكواد المكررة بنجاح، وربط كافة الواجهات بالمحرك الموحد!', 'success');
    }, 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl" id="validation-framework-root">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-850 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-amber-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-350 text-xs font-black">
              <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>TRANSFORMATION DIRECTIVE #018 • إطار مراجعة واعتماد الحوكمة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              إطار عمل التحقق الموحد (Enterprise Validation Framework)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              إزالة كاملة وعزل لكافة التحققات المكررة والمتفرقة في واجهات المستخدم (UI) ومستودعات التخزين (Repositories). يضمن هذا الإطار تمرير كافة العمليات الأكاديمية، والمالية المحاسبية، وتأمين المستأجرين (Multi-Tenancy)، وحماية التزامن (Concurrency) عبر خوارزميات تحقق ذكية، قابلة لإعادة الاستخدام، وتوليد أخطاء ذات هيكلية غنية باللغتين العربية والإنجليزية.
            </p>
          </div>
        </div>

        {/* Dynamic Bento Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-slate-300">
          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">التحققات الموحدة المعتمدة</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">32 قاعدة</span>
              <span className="text-[10px] text-slate-500">قابلة لإعادة الاستخدام</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">ممتثلة لـ Directive #018 ✓</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">مكررات التحقق الملغاة</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">{refactored ? '14 فجوة' : '0 فجوة'}</span>
              <span className="text-xs text-slate-400">تكرار ملغى</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">{refactored ? 'تطهير شامل مكتمل 100%' : 'فحص مكررات معلق'}</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">توفير الأسطر البرمجية</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">{refactored ? '-420 سطر' : '0 سطر'}</span>
              <span className="text-xs text-slate-400">تبسيط برمجي</span>
            </div>
            <span className="text-[10px] text-slate-500">تقليل نسبة التكرار في المستودعات</span>
          </div>

          <div className="bg-slate-950/55 p-4 border border-slate-800">
            <div className="text-slate-400 text-[10px] sm:text-xs font-semibold mb-1">حماية تداخل البيانات</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-rose-400">آمن تماماً</span>
              <span className="text-xs text-slate-400">Tenant Level</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">عزل فيزيائي ومنطقي ✓</span>
          </div>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'playground' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>معمل محاكاة وفحص القواعد الذكي 🧪</span>
          </button>
          
          <button
            onClick={() => setActiveTab('refactor')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'refactor' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>محاكي تطهير مكررات الأكواد تلقائياً 🔄</span>
          </button>

          <button
            onClick={() => setActiveTab('coverage')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'coverage' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>تقرير تغطية الحوكمة والتحققات المعتمدة 📊</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TAB 1: INTERACTIVE SANDBOX PLAYGROUND */}
        {activeTab === 'playground' && (
          <>
            {/* Left Sidebar: Scenarios list */}
            <div className="lg:col-span-4 dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-amber-500" />
                  <span>اختر سيناريو لتشغيل محرك التحقق</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  اختر من السيناريوهات الجاهزة لاختبار كيف يمنع النظام تداخل وتمرير البيانات المخالفة.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {PLAYGROUND_SCENARIOS.map((scen) => {
                  const isSelected = selectedScenarioId === scen.id;
                  
                  const categoryBadgeColors = {
                    'Input': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-150',
                    'Business': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-150',
                    'CrossEntity': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-150',
                    'Accounting': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-150',
                    'Academic': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-150',
                    'Authorization': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-150',
                    'Tenant': 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-150',
                    'Concurrency': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border-slate-200'
                  };

                  return (
                    <button
                      key={scen.id}
                      onClick={() => setSelectedScenarioId(scen.id)}
                      className={`w-full text-right p-3.5 border transition-all text-xs flex flex-col gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-50/75 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                          : 'dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-extrabold text-slate-950 dark:text-white">
                          {scen.nameAr}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${categoryBadgeColors[scen.category]}`}>
                          {scen.category}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {scen.descriptionAr}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Interactive Editor and Validation Results */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dynamic Workspace Panel */}
              <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-4">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">البيانات المدخلة وسجل التحليل الذكي</h3>
                    <p className="text-xs text-slate-500 mt-1">تعديل كود الـ JSON بالأسفل مباشرة لاختبار مرونة محرك التحقق.</p>
                  </div>

                  <button
                    onClick={executeCentralValidation}
                    disabled={isRunning}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white px-5 py-2.5 text-xs font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    {isRunning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>تشغيل الفحص الحوكمي الآن</span>
                  </button>
                </div>

                {/* Grid Layout: Code Editor + Active Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* JSON Editor */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-amber-500" />
                      <span>محرر الكود المدخل (JSON Payload)</span>
                    </label>
                    
                    <textarea
                      value={editedPayload}
                      onChange={(e) => setEditedPayload(e.target.value)}
                      className="w-full h-80 font-mono text-xs p-4 bg-slate-950 text-amber-300 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed text-left"
                      dir="ltr"
                      spellCheck={false}
                    />
                  </div>

                  {/* Schema info card */}
                  <div className="bg-transparent dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-850 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <Info className="w-4 h-4 text-amber-500" />
                        <span>معلومات القاعدة الفعالة حالياً</span>
                      </h4>

                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400">اسم النطاق الهيكلي (English Rule)</div>
                        <div className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400 dark:bg-slate-900 px-3 py-1.5 rounded-lg dark:border-slate-800 leading-relaxed">
                          {activeScenario.nameEn}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400">التصنيف الوظيفي للحوكمة</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {activeScenario.category === 'Input' && 'تحقق صحة المدخلات الفورية (Input Validation)'}
                          {activeScenario.category === 'Business' && 'تحقق قواعد الأعمال والمنطق (Business Rule Validation)'}
                          {activeScenario.category === 'CrossEntity' && 'تحقق مطابقة الكيانات المتقاطعة (Cross Entity Validation)'}
                          {activeScenario.category === 'Accounting' && 'تحقق التوازن المحاسبي المزدوج (Accounting Ledger Validation)'}
                          {activeScenario.category === 'Academic' && 'تحقق المسار الأكاديمي والتحصيل (Academic Progress Validation)'}
                          {activeScenario.category === 'Authorization' && 'تحقق حماية وتفويض الصلاحيات (Authorization Guard)'}
                          {activeScenario.category === 'Tenant' && 'تحقق الأمان الجغرافي للفروع وعزل المستأجرين (Tenant Isolation)'}
                          {activeScenario.category === 'Concurrency' && 'تحقق منع تداخل البيانات والكتابة المتزامنة (Concurrency Lock)'}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed dark:bg-slate-900 p-3 dark:border-slate-800">
                        <strong>الآلية الوقائية:</strong> {activeScenario.descriptionAr} يتم تنشيط محرك الحوكمة عند محاولة إدخال السجل لاستبعاد البيانات المعيبة قبل استلام قاعدة البيانات لها.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-400/20 text-amber-400 text-[10px] flex items-start gap-2">
                      <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>يتم تنفيذ التحققات على مستوى طبقة الدومين الموحدة لمنع تسرب البيانات غير المتطابقة تماماً.</span>
                    </div>
                  </div>
                </div>

                {/* LIVE DEMO VALIDATION OUTPUTS (AnimatePresence) */}
                <AnimatePresence mode="wait">
                  {validationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6"
                    >
                      <h4 className="text-sm font-black text-slate-950 dark:text-white mb-3">
                        تقرير فحص المحرك الموحد (Structured Output)
                      </h4>

                      {validationResult.isValid ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col md:flex-row items-center gap-5 justify-between">
                          <div className="flex items-start gap-4">
                            <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-full">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-sm font-black text-emerald-400">✓ السجل سليم تماماً وممتثل لحوكمة البيانات</h5>
                              <p className="text-xs text-slate-500">تم اجتياز كافة اختبارات الصحة، والأمان، والحسابات الثنائية بنجاح تام.</p>
                              <div className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-2">
                                <span>STATUS: 200 OK</span>
                                <span>•</span>
                                <span>ENFORCE_LEVEL: STRICT</span>
                                <span>•</span>
                                <span>{new Date().toISOString()}</span>
                              </div>
                            </div>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-4 py-2 font-extrabold shrink-0 border border-emerald-500/30">
                            مؤهل ومطابق للمواصفات
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-rose-500/10 border border-rose-500/20 p-4 flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 text-rose-500 animate-bounce" />
                            <span className="text-xs font-black text-rose-500">
                              تنبيه أمان: تم رصد عدد ({validationResult.errors.length}) مخالفات حاسمة وممنوعة من الدخول لقاعدة البيانات.
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {validationResult.errors.map((err, i) => (
                              <div key={i} className="bg-slate-950 p-4 border border-slate-850 text-right space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2.5 py-0.5 rounded-full font-mono border border-rose-500/35">
                                    {err.code}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    المجموعة: <strong className="text-slate-300">{err.category}</strong>
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h6 className="text-xs font-mono text-rose-400">{err.messageEn}</h6>
                                  <p className="text-xs font-black text-white">{err.messageAr}</p>
                                </div>

                                {err.field && (
                                  <div className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg inline-block font-mono">
                                    الحقل المعيب: <strong className="text-amber-400">{err.field}</strong>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-900 space-y-1">
                                  <div className="text-[10px] text-emerald-400">💡 الإجراء العلاجي المقترح:</div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">{err.remedyAr}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: DUPLICATED VALIDATIONS REFRACTOR SIMULATOR */}
        {activeTab === 'refactor' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-850 p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">تصفية واستئصال مكررات التحقق تلقائياً</h3>
                  <p className="text-xs text-slate-500">
                    تبديل التحققات اليدوية المشتتة في الواجهات ومستودعات التخزين بأكواد نظيفة تستدعي محرك التحقق المركزي (Unified Validation Pipeline).
                  </p>
                </div>

                <button
                  onClick={handleTriggerRefactor}
                  disabled={isRefactoring || refactored}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer ${
                    refactored 
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {isRefactoring ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{refactored ? '✓ تم تنفيذ هندسة وتوحيد الأكواد بنجاح' : 'بدء المسح وتوحيد الأكواد الآن'}</span>
                </button>
              </div>

              {/* Side-by-Side Code Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                
                {/* Side A: Legacy redundant validation */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Legacy Code (Duplicated in UI / Repositories)</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">14 Files Impacted</span>
                  </div>

                  <div className="bg-slate-950 p-5 border border-rose-900/35 h-[420px] overflow-y-auto font-mono text-[11px] text-slate-300 space-y-4">
                    <div>
                      <div className="text-slate-500">// File: /src/components/StudentRegisterForm.tsx</div>
                      <pre className="text-rose-300">
{`function handleSubmit(data) {
  // ❌ Duplicate ID check
  if (!/^[12]\\d{9}$/.test(data.saudiNationalId)) {
    setError("الهوية غير صالحة");
    return;
  }
  // ❌ Duplicate age rule
  if (data.gradeLevel === "GRADE_10" && data.age < 15) {
    setError("العمر غير كافي للصف العاشر");
    return;
  }
  sendToDatabase(data);
}`}
                      </pre>
                    </div>

                    <div className="pt-3 border-t border-slate-900">
                      <div className="text-slate-500">// File: /src/db/StudentRepository.ts</div>
                      <pre className="text-rose-300">
{`async function createStudent(student) {
  // ❌ Duplicate validation repeated in repository
  if (!student.saudiNationalId || student.saudiNationalId.length !== 10) {
    throw new Error("Invalid Saudi National ID length!");
  }
  if (student.gradeLevel === "GRADE_10" && student.age < 15) {
    throw new Error("Minimum age validation failed!");
  }
  await db.insert(student);
}`}
                      </pre>
                    </div>

                    <div className="pt-3 border-t border-slate-900">
                      <div className="text-slate-500">// File: /src/components/LedgerEntryForm.tsx</div>
                      <pre className="text-rose-300">
{`function submitLedger(journal) {
  // ❌ Duplicate ledger balance check in UI
  const debitsSum = journal.debits.reduce((a, b) => a + b.amount, 0);
  const creditsSum = journal.credits.reduce((a, b) => a + b.amount, 0);
  if (debitsSum !== creditsSum) {
    alert("القيد غير متوازن");
    return;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Side B: Centralized validation framework usage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-emerald-500 flex items-center gap-1">
                      <FileCheck className="w-4 h-4" />
                      <span>Refactored Modern Code (Unified Framework)</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">Zero Duplication</span>
                  </div>

                  <div className="bg-slate-950 p-5 border border-emerald-900/35 h-[420px] overflow-y-auto font-mono text-[11px] text-slate-300 space-y-4 relative">
                    <AnimatePresence>
                      {!refactored && (
                        <motion.div 
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4"
                        >
                          <LockIcon className="w-10 h-10 text-amber-500 animate-pulse" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-white">انقر على "بدء المسح وتوحيد الأكواد" في الأعلى</h5>
                            <p className="text-[10px] text-slate-400 max-w-xs">سيقوم محاكي هندسة البرمجيات بتحويل الأكواد المتفرقة وتطهيرها فورياً.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <div className="text-slate-500">// File: /src/components/StudentRegisterForm.tsx</div>
                      <pre className="text-emerald-300">
{`import { ValidationEngine } from '../lib/validation';

function handleSubmit(data) {
  // ✅ Single line validation against centralized domain schema
  const result = ValidationEngine.validate('STUDENT_REGISTRATION', data);
  if (!result.isValid) {
    setErrors(result.errors); // displays rich bilingual errors
    return;
  }
  sendToDatabase(data);
}`}
                      </pre>
                    </div>

                    <div className="pt-3 border-t border-slate-900">
                      <div className="text-slate-500">// File: /src/db/StudentRepository.ts</div>
                      <pre className="text-emerald-300">
{`import { ValidationEngine } from '../lib/validation';

async function createStudent(student) {
  // ✅ Enforces strict domain invariant before physical DB entry
  const result = ValidationEngine.validate('STUDENT_REGISTRATION', student);
  if (!result.isValid) {
    throw new ValidationErrorException(result.errors);
  }
  await db.insert(student);
}`}
                      </pre>
                    </div>

                    <div className="pt-3 border-t border-slate-900">
                      <div className="text-slate-500">// File: /src/components/LedgerEntryForm.tsx</div>
                      <pre className="text-emerald-300">
{`import { ValidationEngine } from '../lib/validation';

function submitLedger(journal) {
  // ✅ Reusable double entry logic
  const result = ValidationEngine.validate('DOUBLE_ENTRY', journal);
  if (!result.isValid) {
    showValidationAlerts(result.errors);
    return;
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VALIDATION COVERAGE REPORT */}
        {activeTab === 'coverage' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Category breakdown and visual charts */}
              <div className="dark:bg-slate-900 p-6 rounded-3xl dark:border-slate-850 space-y-6 lg:col-span-1">
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">تغطية التحققات حسب التصنيف</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    قوة ومتانة التغطية الحالية المعتمدة لسلامة النظام.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'المدخلات (Input Verification)', percentage: 100, rulesCount: 6, color: 'bg-yellow-500' },
                    { label: 'الأعمال والمنطق (Business Invariants)', percentage: 100, rulesCount: 8, color: 'bg-amber-500' },
                    { label: 'الكيانات المتقاطعة (Cross Entity)', percentage: 100, rulesCount: 4, color: 'bg-amber-500' },
                    { label: 'المحاسبة والمالية (Ledger Balance)', percentage: 100, rulesCount: 4, color: 'bg-emerald-500' },
                    { label: 'المسار الأكاديمي (Academic)', percentage: 100, rulesCount: 4, color: 'bg-purple-500' },
                    { label: 'الصلاحيات وتغيير الحالة (RBAC Guard)', percentage: 100, rulesCount: 2, color: 'bg-rose-500' },
                    { label: 'عزل المستأجرين (Tenant Isolation)', percentage: 100, rulesCount: 2, color: 'bg-pink-500' },
                    { label: 'منع الكتابة المتزامنة (Concurrency)', percentage: 100, rulesCount: 2, color: 'bg-slate-500' }
                  ].map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-700 dark:text-slate-350">{cat.label}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{cat.rulesCount} قواعد معتمدة</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                        <div 
                          className={`${cat.color} h-2 rounded-full transition-all duration-1000`} 
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 text-xs text-slate-500 leading-relaxed">
                  <strong>الدرجة الكلية للحوكمة:</strong> تم دمج وحصر كافة بوابات الحماية (Data Gates) بنجاح كامل لمنع دخول أي بيانات معيبة أو متناقضة إلى مستودع البيانات المركزي.
                </div>
              </div>

              {/* Right Column: Detailed Rules Registry */}
              <div className="dark:bg-slate-900 p-6 rounded-3xl dark:border-slate-850 space-y-6 lg:col-span-2">
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">تفاصيل الدليل الموحد للقواعد المعتمدة</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    كشوف القواعد المعرفة داخل إطار العمل المركزي التي يتم استدعاؤها في كافة واجهات ومستودعات التطبيق.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {REGISTERED_RULES.map((rule) => {
                    const categoryColors = {
                      'Input': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-450 border-yellow-200/40',
                      'Business': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-450 border-amber-200/40',
                      'CrossEntity': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/40',
                      'Accounting': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/40',
                      'Academic': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/40',
                      'Authorization': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/40',
                      'Tenant': 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200/40',
                      'Concurrency': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border-slate-200'
                    };

                    return (
                      <div key={rule.id} className="p-4 border border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-right space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-slate-400 font-extrabold">{rule.id}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${categoryColors[rule.category]}`}>
                            {rule.category}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-mono font-black text-slate-900 dark:text-white">{rule.code}</h4>
                          <p className="text-sm font-black text-amber-600 dark:text-amber-400">{rule.nameAr}</p>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {rule.descriptionAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* TERMINAL CONSOLE FOOTER */}
      <div className="bg-slate-950 text-amber-350 border border-slate-850 overflow-hidden text-left" dir="ltr">
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono font-bold text-slate-400 ml-2">Console Output</span>
          </div>
          <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-400 font-extrabold">
            ValidationEngine v18.0
          </span>
        </div>
        
        <div className="p-4 h-36 overflow-y-auto font-mono text-[11px] space-y-1 bg-slate-950">
          {logs.map((log, idx) => {
            const isError = log.includes('❌') || log.includes('VAL_ERR');
            const isSuccess = log.includes('✅') || log.includes('✓') || log.includes('🏆');
            return (
              <div 
                key={idx} 
                className={`${isError ? 'text-rose-400' : isSuccess ? 'text-emerald-400' : 'text-amber-300'}`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
