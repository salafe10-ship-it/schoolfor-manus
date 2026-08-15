import { Activity, AlertTriangle, ArrowRightLeft, Award, BookOpen, Check, CheckCircle2, CheckSquare, Coins, Database, Delete, FileCheck, Grid, Key, Landmark, List, Lock as LockIcon, Logs, Monitor, Navigation, Phone, Play, Plus, RefreshCw, Scale, Section, ShieldAlert, ShieldCheck, Sliders, Sparkles, Trash2, UserCheck, Verified } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface EnterpriseDataIntegrityBusinessRulesCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

// Interfaces for structured data
interface MockStudent {
  id: string;
  name: string;
  nationalId: string;
  academicNumber: string;
  feesDue: number;
  feesPaid: number;
}

interface LedgerLine {
  id: string;
  account: string;
  debit: number;
  credit: number;
}

interface ExamResult {
  studentName: string;
  subject: string;
  score: number;
  grade: string;
  status: 'Pass' | 'Fail';
}

export default function EnterpriseDataIntegrityBusinessRulesCertification({ triggerNotification }: EnterpriseDataIntegrityBusinessRulesCertificationProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'integrity' | 'business' | 'acid' | 'validation' | 'cert'>('cert');

  // --- State for DATA INTEGRITY Section ---
  const [students, setStudents] = useState<MockStudent[]>([
    { id: 'STU-101', name: 'أحمد محمود العتيبي', nationalId: '1098472847', academicNumber: '4420101', feesDue: 5000, feesPaid: 3500 },
    { id: 'STU-102', name: 'سارة عبد الرحمن الشهري', nationalId: '1082738192', academicNumber: '4420102', feesDue: 5000, feesPaid: 5000 },
    { id: 'STU-103', name: 'خالد وليد الشمري', nationalId: '1092837461', academicNumber: '4420103', feesDue: 4500, feesPaid: 0 }
  ]);

  // Unique constraint testing state
  const [newNationalId, setNewNationalId] = useState<string>('');
  const [newAcademicNumber, setNewAcademicNumber] = useState<string>('');
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  // Cascade Deletion/Orphan prevention simulator state
  const [orphanPreventionLog, setOrphanPreventionLog] = useState<string[]>([
    'تم تفعيل قيد المفتاح الأجنبي (Foreign Key Constraints) على مستوى جدول الطلاب والرسوم والمكافآت.',
    'جميع السجلات المرتبطة بالطلاب تخضع لسياسة التحقق التلقائي لمنع البيانات اليتيمة.'
  ]);

  // --- State for BUSINESS RULES Section ---
  // Fees and Installments
  const [baseFees, setBaseFees] = useState<number>(6000);
  const [siblingDiscountCount, setSiblingDiscountCount] = useState<number>(0); // number of siblings
  const [isOutstandingStudent, setIsOutstandingStudent] = useState<boolean>(false);
  const [installmentMonths, setInstallmentMonths] = useState<number>(4);

  // Calculated dynamic fees
  const dynamicFeesCalc = useMemo(() => {
    let discount = 0;
    if (siblingDiscountCount === 1) discount += 10; // 10% for first sibling
    else if (siblingDiscountCount >= 2) discount += 20; // 20% for 2 or more
    if (isOutstandingStudent) discount += 15; // 15% academic excellence discount

    const discountAmount = (baseFees * discount) / 100;
    const finalFees = baseFees - discountAmount;
    const installmentAmount = Math.round(finalFees / installmentMonths);

    return {
      discountPercentage: discount,
      discountAmount,
      finalFees,
      installmentAmount
    };
  }, [baseFees, siblingDiscountCount, isOutstandingStudent, installmentMonths]);

  // Ledger state (Double-entry check)
  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>([
    { id: 'L-1', account: 'حساب النقدية والبنك (Assets)', debit: 5000, credit: 0 },
    { id: 'L-2', account: 'إيرادات الرسوم الدراسية (Revenue)', debit: 0, credit: 5000 },
  ]);
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newDebit, setNewDebit] = useState<number>(0);
  const [newCredit, setNewCredit] = useState<number>(0);

  // Exam calculator
  const [examScore, setExamScore] = useState<number>(85);
  const calculatedGrade = useMemo(() => {
    if (examScore >= 95) return { letter: 'A+', status: 'Pass', color: 'text-emerald-500' };
    if (examScore >= 90) return { letter: 'A', status: 'Pass', color: 'text-emerald-500' };
    if (examScore >= 80) return { letter: 'B', status: 'Pass', color: 'text-amber-500' };
    if (examScore >= 70) return { letter: 'C', status: 'Pass', color: 'text-orange-500' };
    if (examScore >= 60) return { letter: 'D', status: 'Pass', color: 'text-amber-500' };
    if (examScore >= 50) return { letter: 'E', status: 'Pass', color: 'text-orange-500' };
    return { letter: 'F', status: 'Fail', color: 'text-rose-500' };
  }, [examScore]);

  // Payroll calculation state
  const [basicSalary, setBasicSalary] = useState<number>(8000);
  const [allowances, setAllowances] = useState<number>(1500); // سكن ومواصلات
  const [deductions, setDeductions] = useState<number>(500); // غياب أو تأمين اجتماعي
  const [taxPercent, setTaxPercent] = useState<number>(10); // ساند أو ضرائب

  const netSalary = useMemo(() => {
    const gross = basicSalary + allowances;
    const taxAmount = (gross * taxPercent) / 100;
    return gross - taxAmount - deductions;
  }, [basicSalary, allowances, deductions, taxPercent]);

  // --- State for TRANSACTION SAFETY (ACID) Section ---
  const [acidStatus, setAcidStatus] = useState<'idle' | 'step1' | 'step2' | 'step3' | 'completed' | 'rolled_back'>('idle');
  const [acidLogs, setAcidLogs] = useState<string[]>([]);
  const [failStep3, setFailStep3] = useState<boolean>(false);
  const [simulatedAccountBalance, setSimulatedAccountBalance] = useState<number>(250000);
  const [simulatedLedgerCount, setSimulatedLedgerCount] = useState<number>(140);

  // --- State for VALIDATION Section ---
  const [testFullName, setTestFullName] = useState<string>('');
  const [testAge, setTestAge] = useState<number>(12);
  const [testPhone, setTestPhone] = useState<string>('');
  const [testNationalIdInput, setTestNationalIdInput] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);

  // --- Interactive Certification Scores ---
  const [scores, setScores] = useState({
    dataIntegrity: 98,
    businessRules: 96,
    validation: 95,
    transactionSafety: 97
  });

  const overallScore = useMemo(() => {
    const vals = Object.values(scores) as number[];
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [scores]);

  // Check unique constraints handler
  const handleCheckUniqueConstraints = () => {
    if (!newNationalId && !newAcademicNumber) {
      setDuplicateCheckResult({ status: 'error', message: 'الرجاء إدخال رقم الهوية الوطنية أو الرقم الأكاديمي أولاً.' });
      return;
    }

    const hasDuplicateNational = students.some(s => s.nationalId === newNationalId);
    const hasDuplicateAcademic = students.some(s => s.academicNumber === newAcademicNumber);

    if (hasDuplicateNational) {
      setDuplicateCheckResult({ 
        status: 'error', 
        message: `خطأ تكرار (Unique Constraint Violation): رقم الهوية الوطنية ${newNationalId} مسجل مسبقاً في النظام ولا يمكن تكراره.` 
      });
      triggerNotification('تم رصد تكرار في الهوية الوطنية! تم تفعيل منع التكرار بنجاح.', 'warning');
    } else if (hasDuplicateAcademic) {
      setDuplicateCheckResult({ 
        status: 'error', 
        message: `خطأ تكرار (Unique Constraint Violation): الرقم الأكاديمي ${newAcademicNumber} مسجل مسبقاً في النظام ولا يمكن تكراره.` 
      });
      triggerNotification('تم رصد تكرار في الرقم الأكاديمي! تم حظر الحفظ بنجاح.', 'warning');
    } else {
      setDuplicateCheckResult({ 
        status: 'success', 
        message: 'مستوفى الشروط: المعرفات مدخلة بشكل صحيح ولا توجد أي سجلات مكررة مطابقة في قواعد البيانات. يمكنك الحفظ بأمان.' 
      });
      triggerNotification('التحقق ناجح: لا توجد تكرارات.', 'success');
    }
  };

  // Add ledger line handler
  const handleAddLedgerLine = () => {
    if (!newAccountName) {
      triggerNotification('يرجى تحديد اسم الحساب للسطر المالي.', 'warning');
      return;
    }
    if (newDebit < 0 || newCredit < 0) {
      triggerNotification('القيم المالية يجب أن تكون أكبر من أو تساوي الصفر.', 'danger');
      return;
    }

    const newLine: LedgerLine = {
      id: `L-${Date.now()}`,
      account: newAccountName,
      debit: Number(newDebit),
      credit: Number(newCredit)
    };

    setLedgerLines([...ledgerLines, newLine]);
    setNewAccountName('');
    setNewDebit(0);
    setNewCredit(0);
    triggerNotification('تم إضافة سطر القيد بنجاح. يرجى التحقق من توازن القيد الكلي.', 'info');
  };

  // Delete ledger line
  const handleDeleteLedgerLine = (id: string) => {
    setLedgerLines(ledgerLines.filter(line => line.id !== id));
    triggerNotification('تم حذف سطر القيد المالي.', 'info');
  };

  // Calculate Ledger Balance Check (Double-entry checking rule)
  const ledgerSum = useMemo(() => {
    const totalDebit = ledgerLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = ledgerLines.reduce((sum, line) => sum + line.credit, 0);
    const isBalanced = totalDebit === totalCredit;
    return {
      totalDebit,
      totalCredit,
      isBalanced,
      difference: Math.abs(totalDebit - totalCredit)
    };
  }, [ledgerLines]);

  // Delete Student with Orphan check simulation
  const handleDeleteStudent = (id: string, name: string) => {
    // Cascade deletion simulation: In a system with orphan checks, 
    // we must prompt or prevent deleting a student who has active financial records
    const student = students.find(s => s.id === id);
    if (student && student.feesDue > student.feesPaid) {
      // Trigger protection warning
      setOrphanPreventionLog(prev => [
        `[حماية منع البيانات اليتيمة] تم حظر حذف الطالب "${name}" لوجود رسوم مستحقة غير مدفوعة (${student.feesDue - student.feesPaid} ريال).`,
        ...prev
      ]);
      triggerNotification(`تعذر حذف الطالب ${name} لمنع حدوث بيانات يتيمة ووجود ذمم مالية معلقة!`, 'danger');
    } else {
      setStudents(students.filter(s => s.id !== id));
      setOrphanPreventionLog(prev => [
        `[حذف متتالي معتمد] تم حذف الطالب "${name}" وتطبيق الحذف المتتالي (CASCADE DELETE) على سجلاته المرتبطة بنجاح وبدون ترك أي بيانات يتيمة.`,
        ...prev
      ]);
      triggerNotification(`تم حذف سجل الطالب ${name} وتحديث الجداول المرتبطة بالتبعية.`, 'success');
    }
  };

  // ACID Transaction simulator function
  const runAcidTransaction = () => {
    setAcidStatus('step1');
    setAcidLogs([`[البدء] بدء معاملة مالية جديدة: دفع قسط دراسي بمبلغ 2,500 ريال لطالب...`]);
    
    // Step 1: Lock student record & verify solvency (Isolation)
    setTimeout(() => {
      setAcidLogs(prev => [...prev, `[الخطوة 1 - العزل والاتساق] جاري قفل سجلات الحساب لمنع عمليات الخصم المزدوج بالتوازي. تم التحقق من سلامة الأرصدة.`]);
      setAcidStatus('step2');
      
      // Step 2: Debit Cash Account
      setTimeout(() => {
        setAcidLogs(prev => [...prev, `[الخطوة 2 - الذرية] تم زيادة حساب النقدية بالصندوق بمبلغ 2,500 ريال بنجاح (المجموع الجديد: $${(simulatedAccountBalance + 2500).toLocaleString()}).`]);
        setAcidStatus('step3');
        
        // Step 3: Insert Ledger entry (with optional simulated failure)
        setTimeout(() => {
          if (failStep3) {
            setAcidLogs(prev => [
              ...prev, 
              `[الخطوة 3 - فشل الذرية] خطأ فادح في الشبكة أو قاعدة البيانات أثناء كتابة القيد المالي اليومي!`,
              `[الاسترجاع الكلي - ROLLBACK] جاري تطبيق استرجاع شامل لجميع التغييرات السابقة لمنع تشتت البيانات اليتيمة...`,
              `[معلومات الاسترجاع] تم إعادة رصيد الصندوق إلى قيمته السابقة $${simulatedAccountBalance.toLocaleString()}`,
              `[حالة المعاملة] تم إلغاء كافة العمليات بنجاح ودون ترك أي أثر (All or Nothing Principle achieved ✓).`
            ]);
            setAcidStatus('rolled_back');
            triggerNotification('تم فشل الخطوة الأخيرة وتدشين التراجع الشامل (Rollback) بنجاح لضمان عدم حدوث تشتت مالي!', 'warning');
          } else {
            // Success
            setSimulatedAccountBalance(prev => prev + 2500);
            setSimulatedLedgerCount(prev => prev + 1);
            setAcidLogs(prev => [
              ...prev, 
              `[الخطوة 3 - الذرية] تم إدراج قيد اليومية رقم ${(simulatedLedgerCount + 1)} بالدائن والمدين بنجاح.`,
              `[الخطوة 4 - الديمومة] تم كتابة المعاملة نهائياً بنجاح إلى سجلات التخزين السحابي ووحدات النسخ الاحتياطي (COMMIT TRANSACTION).`,
              `[معلومات الاتساق] إجمالي الأصول والإيرادات توازنت تماماً بقيمة تبلغ $${(simulatedAccountBalance + 2500).toLocaleString()}.`
            ]);
            setAcidStatus('completed');
            triggerNotification('اكتملت المعاملة المالية وفق معايير ACID الأربعة بنجاح مطلق!', 'success');
          }
        }, 1200);

      }, 1000);

    }, 800);
  };

  // Interactive Live Validation testing
  const handleValidateForm = () => {
    const errors: string[] = [];
    const logs: string[] = [];

    logs.push('بدء عملية فحص وتحليل الحقول والمدخلات الحيوية...');

    // Name Validation
    if (!testFullName) {
      errors.push('الاسم الكامل مطلوب ولا يمكن تركه فارغاً.');
    } else if (testFullName.trim().length < 7) {
      errors.push('الاسم الكامل يجب أن يتكون من 3 مقاطع على الأقل لضمان المطابقة الرسمية (لا يقل عن 7 أحرف).');
    }

    // Age validation
    if (testAge === undefined || testAge === null) {
      errors.push('العمر السنوي مطلوب.');
    } else if (testAge < 5 || testAge > 19) {
      errors.push('خطأ في النطاق (Range Constraint): عمر الطالب يجب أن يتراوح بين 5 سنوات و 19 سنة للمدارس العامة والخاصة.');
    }

    // Phone Validation
    const phoneRegex = /^05\d{8}$/;
    if (!testPhone) {
      errors.push('رقم جوال ولي الأمر مطلوب.');
    } else if (!phoneRegex.test(testPhone)) {
      errors.push('تنسيق رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0512345678).');
    }

    // National ID validation
    const nationalIdRegex = /^\d{10}$/;
    if (!testNationalIdInput) {
      errors.push('رقم الهوية الوطنية أو الإقامة مطلوب.');
    } else if (!nationalIdRegex.test(testNationalIdInput)) {
      errors.push('يجب أن يتكون رقم الهوية الوطنية/الإقامة من 10 خانات رقمية فقط وبدون مسافات أو رموز.');
    }

    setValidationErrors(errors);
    
    if (errors.length > 0) {
      logs.push(`فشل التحقق: تم العثور على عدد (${errors.length}) أخطاء في قيود التحقق البرمجية.`);
      setValidationLogs(logs);
      triggerNotification('فشل في التحقق من المدخلات! يرجى إصلاح الأخطاء الموضحة لمنع الإدخال غير الصحيح.', 'danger');
    } else {
      logs.push('مبروك! تم اجتياز كافة قيود التحقق والصلاحية بنجاح وبدون أي أخطاء. السجل جاهز للحفظ الآمن.');
      setValidationLogs(logs);
      triggerNotification('تم التحقق من الحقول بنجاح! المدخلات مطابقة للقيود البرمجية والقواعد المؤسسية.', 'success');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Dynamic Main Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#111c38] to-slate-950 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-end lg:justify-start">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                اعتماد سلامة البيانات وقواعد الأعمال بالمنصة (Data Integrity & Business Rules Certification)
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md">المرحلة الخامسة عشرة: المعايير الذهبية للامتثال والاتساق</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">بوابة التحقق الشامل من تكامل البيانات والالتزام بقواعد الأعمال وقوانين ACID</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              تتيح لك هذه المنصة التفاعلية المتقدمة مراجعة آليات الحفاظ على سلامة البيانات وقواعد الأعمال الحيوية للمؤسسة التعليمية. تفقد العلاقات المرجعية، وامنع البيانات اليتيمة والتكرار، وقم بمراجعة الاحتساب التلقائي للرسوم والأقساط، والرواتب، والامتحانات، مع محاكاة معاملات ACID الفورية لضمان تجربة برمجية ومحاسبية خالية من الأخطاء والعيوب ومستوفية لجميع معايير الاعتماد الفني المرموق.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">معدل الامتثال الكلي للسلامة</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              {overallScore}%
            </span>
            <p className="text-[10px] text-slate-300 mt-1 font-extrabold flex items-center gap-1 justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>معتمد بالدرجة الكاملة</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs of Certification Suite */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('cert')}
          className={`py-2.5 px-4 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'cert' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-transparent dark:bg-slate-950/40'}`}
        >
          <Award className="w-4 h-4" />
          <span>خامساً: بطاقة الاعتماد الكلية (Certification)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('integrity')}
          className={`py-2.5 px-4 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'integrity' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-transparent dark:bg-slate-950/40'}`}
        >
          <Database className="w-4 h-4" />
          <span>أولاً: سلامة واكتمال البيانات (Data Integrity)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('business')}
          className={`py-2.5 px-4 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'business' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-transparent dark:bg-slate-950/40'}`}
        >
          <Scale className="w-4 h-4" />
          <span>ثانياً: تطبيق قواعد الأعمال (Business Rules)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('acid')}
          className={`py-2.5 px-4 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'acid' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-transparent dark:bg-slate-950/40'}`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>ثالثاً: معاملات ACID الآمنة (Transactions)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('validation')}
          className={`py-2.5 px-4 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'validation' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-transparent dark:bg-slate-950/40'}`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>رابعاً: التحقق من المدخلات (Validation)</span>
        </button>
      </div>

      {/* Main Content Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* RIGHT PANEL: Tab Content */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* TAB: INTEGRITY (سلامة واكتمال البيانات) */}
          {activeSubTab === 'integrity' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  <span>أولاً: التحقق من العلاقات المرجعية، ومنع التكرار والبيانات اليتيمة</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">بوابة ضمان اتساق الكيانات والمفاتيح المرجعية الفريدة بقاعدة البيانات</p>
              </div>

              {/* Requirement Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">العلاقات المرجعية (Referential Integrity)</span>
                  <p className="text-[10.5px] text-slate-500 leading-normal">تتحقق من تطابق مفاتيح الطلاب <code className="dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[9px]">STU-ID</code> عبر جميع جداول الامتحانات والرسوم لعدم وجود بيانات ضائعة.</p>
                </div>
                <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">منع التكرار (Unique Constraints)</span>
                  <p className="text-[10.5px] text-slate-500 leading-normal">تمنع تسجيل رقم هوية وطنية أو رقم أكاديمي متطابق لأكثر من طالب على نطاق المنظومة كلياً.</p>
                </div>
                <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">منع البيانات اليتيمة (Orphan Prevention)</span>
                  <p className="text-[10.5px] text-slate-500 leading-normal">تمنع حذف الطالب الذي لديه مستحقات معلقة لحماية حقوق المنظمة، وتطبق الحذف المتتالي للحسابات الصفرية.</p>
                </div>
              </div>

              {/* Unique Constraints Test Sandbox */}
              <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <LockIcon className="w-4 h-4 text-amber-500" />
                  <span>محاكي فحص القيود الفريدة والتكرار (Unique Key Validation Unit)</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">اختبار تكرار رقم الهوية الوطنية (National ID):</label>
                    <input 
                      type="text" 
                      placeholder="أدخل رقم الهوية، مثلاً: 1098472847" 
                      value={newNationalId}
                      onChange={(e) => setNewNationalId(e.target.value)}
                      className="w-full px-3 py-2 dark:bg-slate-900 dark:border-slate-800 text-xs font-bold font-mono text-right"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">ملاحظة: المعرف 1098472847 مسجل مسبقاً لدى أحمد محمود.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">اختبار تكرار الرقم الأكاديمي (Academic Number):</label>
                    <input 
                      type="text" 
                      placeholder="أدخل الرقم الأكاديمي، مثلاً: 4420102" 
                      value={newAcademicNumber}
                      onChange={(e) => setNewAcademicNumber(e.target.value)}
                      className="w-full px-3 py-2 dark:bg-slate-900 dark:border-slate-800 text-xs font-bold font-mono text-right"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">ملاحظة: المعرف 4420102 مسجل مسبقاً لدى سارة الشهري.</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNewNationalId('1098472847');
                      setNewAcademicNumber('4420101');
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black cursor-pointer hover:bg-slate-300"
                  >
                    تعبئة قيم مكررة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewNationalId('1109482736');
                      setNewAcademicNumber('4420109');
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black cursor-pointer hover:bg-slate-300"
                  >
                    تعبئة قيم فريدة آمنة
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckUniqueConstraints}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>فحص قيد التفرد بقاعدة البيانات</span>
                  </button>
                </div>

                {/* Constraint Result Panel */}
                {duplicateCheckResult.status !== 'idle' && (
                  <div className={`p-3 border flex items-start gap-2.5 text-xs font-semibold ${
                    duplicateCheckResult.status === 'error' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-rose-800 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {duplicateCheckResult.status === 'error' ? <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                    <div className="space-y-0.5">
                      <strong>{duplicateCheckResult.status === 'error' ? 'تم اكتشاف انتهاك قيد التفرد!' : 'حالة تفرد ممتازة (Unique Constraints Verified)'}</strong>
                      <p className="text-[11px] leading-relaxed opacity-90">{duplicateCheckResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulated Database Student Records & Orphan testing */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <strong className="text-[11px] font-black text-slate-450 block uppercase">سجلات قاعدة البيانات المحاكية (Active Student Records):</strong>
                  <span className="text-[9.5px] text-slate-400 font-bold">تتيح لك تجربة حذف سجلات لمنع تشتت البيانات يتيمة بالأسفل</span>
                </div>

                <div className="space-y-2">
                  {students.map((stu) => {
                    const balance = stu.feesDue - stu.feesPaid;
                    const hasDebt = balance > 0;
                    return (
                      <div key={stu.id} className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                        <div className="space-y-0.5 text-right">
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">{stu.id}</span>
                          <strong className="text-slate-800 dark:text-slate-100 block mt-0.5 text-xs">{stu.name}</strong>
                          <div className="flex gap-3 text-[10px] text-slate-400 font-bold mt-1">
                            <span>الهوية: <span className="font-mono">{stu.nationalId}</span></span>
                            <span>رقم أكاديمي: <span className="font-mono">{stu.academicNumber}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left font-mono">
                            <span className="text-[10px] text-slate-400 block">الحساب المالي</span>
                            <span className={`text-xs font-black ${hasDebt ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {hasDebt ? `مستحق: ${balance} ريال` : 'مسدد بالكامل ✓'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(stu.id, stu.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="حذف الطالب واختبار القيود"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Foreign Keys & Orphan Logs Console */}
              <div className="p-4 bg-[#2a1d13] text-[#fce79a] border border-amber-950 space-y-2 font-mono">
                <span className="text-[10px] font-black text-amber-400 block uppercase">مراقب القيود المرجعية ومنع اليتامى (FK & Orphan Monitor logs):</span>
                <div className="space-y-1.5 text-[11px] leading-relaxed max-h-[120px] overflow-y-auto pr-2">
                  {orphanPreventionLog.map((log, index) => (
                    <div key={index} className="flex gap-2 items-start text-right">
                      <span className="text-emerald-400">✓</span>
                      <p className="text-slate-200">{log}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: BUSINESS RULES (قواعد الأعمال) */}
          {activeSubTab === 'business' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  <span>ثانياً: قواعد الأعمال المعقدة (الرسوم، الأقساط، التحصيل، القيود اليومية، الامتحانات، الرواتب)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">مراجعة تطبيق الحسابات المؤتمتة وصيانة المعايير الحسابية والتعليمية للمدرسة</p>
              </div>

              {/* Accordions / Sub-sections of Business Rules */}
              <div className="space-y-5">
                
                {/* 1. Fees, Discounts & Installments calculation */}
                <div className="bg-transparent dark:bg-slate-950 border border-slate-150 p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/40 pb-2">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    <strong className="text-xs font-black text-slate-800 dark:text-slate-200">1. قواعد الرسوم والخصومات والأقساط المؤتمتة</strong>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">الرسوم الدراسية الأساسية:</label>
                      <input 
                        type="number" step="500" min="2000" max="15000"
                        value={baseFees}
                        onChange={(e) => setBaseFees(Number(e.target.value))}
                        className="w-full px-2 py-1.5 dark:bg-slate-900 rounded text-xs font-bold text-center"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">عدد الأخوة الدارسين بالمدرسة (خصم أخوة):</label>
                      <select 
                        value={siblingDiscountCount}
                        onChange={(e) => setSiblingDiscountCount(Number(e.target.value))}
                        className="w-full px-2 py-1.5 dark:bg-slate-900 rounded text-xs font-bold text-center"
                      >
                        <option value={0}>لا يوجد أخوة دارسين (0%)</option>
                        <option value={1}>أخ واحد مسجل بالمدرسة (خصم 10%)</option>
                        <option value={2}>أخوين أو أكثر مسجلين (خصم 20%)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">تفوق أكاديمي استثنائي (منحة امتياز):</label>
                      <button
                        type="button"
                        onClick={() => setIsOutstandingStudent(!isOutstandingStudent)}
                        className={`w-full py-1.5 rounded text-xs font-black transition-colors ${isOutstandingStudent ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}
                      >
                        {isOutstandingStudent ? 'نشط: خصم امتياز 15%' : 'غير نشط (0%)'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">عدد الأقساط السنوية المعتمدة (Installment Plan):</label>
                      <input 
                        type="range" min="1" max="10" 
                        value={installmentMonths}
                        onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 font-bold block text-left">مقسم على: {installmentMonths} أقساط شهرياً</span>
                    </div>

                    <div className="dark:bg-slate-900 p-3 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">إجمالي نسبة الخصم المستحق</span>
                        <span className="text-amber-600 font-black text-sm">{dynamicFeesCalc.discountPercentage}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">صافي الرسوم المطلوبة</span>
                        <span className="text-emerald-500 font-black text-sm font-mono">{dynamicFeesCalc.finalFees} ريال</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">قيمة القسط الشهري الواحد</span>
                        <span className="text-purple-600 font-black text-sm font-mono">{dynamicFeesCalc.installmentAmount} ريال</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Daily Ledger Balance (القيود اليومية) */}
                <div className="bg-transparent dark:bg-slate-950 border border-slate-150 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-500" />
                      <strong className="text-xs font-black text-slate-800 dark:text-slate-200">2. التحقق من توازن القيود اليومية (Double-Entry Bookkeeping Rule)</strong>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${ledgerSum.isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'}`}>
                      {ledgerSum.isBalanced ? 'القيد متوازن ✓' : 'القيد غير متوازن ❌'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    قانون محاسبي صارم: يجب أن يتطابق إجمالي المدين (Debit) مع الدائن (Credit) قبل الترحيل لحماية الدفاتر المحاسبية للمدرسة.
                  </p>

                  <div className="space-y-2">
                    {ledgerLines.map(line => (
                      <div key={line.id} className="p-2.5 dark:bg-slate-900 border border-slate-150 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 text-xs">{line.account}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-amber-600 text-[11px]">مدين: {line.debit} ريال</span>
                          <span className="font-mono text-emerald-600 text-[11px]">دائن: {line.credit} ريال</span>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteLedgerLine(line.id)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Ledger Line Form */}
                  <div className="dark:bg-slate-900 p-3 border border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">الحساب المالي:</label>
                      <input 
                        type="text" placeholder="اسم الحساب" 
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        className="w-full px-2 py-1 bg-transparent dark:bg-slate-950 rounded font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">مدين (Debit):</label>
                      <input 
                        type="number" 
                        value={newDebit}
                        onChange={(e) => {
                          setNewDebit(Number(e.target.value));
                          if (Number(e.target.value) > 0) setNewCredit(0); // help toggle
                        }}
                        className="w-full px-2 py-1 bg-transparent dark:bg-slate-950 rounded font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">دائن (Credit):</label>
                      <input 
                        type="number" 
                        value={newCredit}
                        onChange={(e) => {
                          setNewCredit(Number(e.target.value));
                          if (Number(e.target.value) > 0) setNewDebit(0); // help toggle
                        }}
                        className="w-full px-2 py-1 bg-transparent dark:bg-slate-950 rounded font-semibold font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLedgerLine}
                      className="bg-amber-600 hover:bg-amber-700 text-white py-1 rounded font-black text-xs flex justify-center items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>أضف سطر</span>
                    </button>
                  </div>

                  {/* Ledger summary results */}
                  <div className="flex justify-between items-center bg-amber-50/50 dark:bg-amber-950/25 p-3 border border-amber-100/60 dark:border-amber-900/40 text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-350">إجمالي مدين: <span className="font-mono text-amber-600">{ledgerSum.totalDebit}</span> ريال</span>
                    <span className="text-slate-600 dark:text-slate-350">إجمالي دائن: <span className="font-mono text-emerald-600">{ledgerSum.totalCredit}</span> ريال</span>
                    {ledgerSum.isBalanced ? (
                      <span className="text-emerald-600">✓ القيد متوازن ومستوفي شروط الترحيل اليومية.</span>
                    ) : (
                      <span className="text-rose-500 animate-pulse font-extrabold">❌ خطأ في القيد: غير متوازن بفارق {ledgerSum.difference} ريال!</span>
                    )}
                  </div>
                </div>

                {/* 3. Grading and Exam Engine (قواعد الامتحانات) */}
                <div className="bg-transparent dark:bg-slate-950 border border-slate-150 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800/40 pb-1.5">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <strong className="text-xs font-black text-slate-800 dark:text-slate-200">3. محرك الامتحانات وتوزيع الدرجات الآلي</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      بناءً على النتيجة المدخلة، يقوم النظام باحتساب التقدير ومخرجات النجاح أو الرسوب لتجهيز الجداول الأكاديمية تلقائياً:
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-black text-slate-500 block">اختبار درجات الطالب (0-100):</label>
                      <input 
                        type="range" min="0" max="100" 
                        value={examScore}
                        onChange={(e) => setExamScore(Number(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                        <span>فشل (أقل من 50)</span>
                        <span>ممتاز (95+)</span>
                      </div>
                    </div>
                  </div>

                  <div className="dark:bg-slate-900 p-4 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">التقدير وحالة الاجتياز المحتسبة</span>
                    <strong className={`text-4xl font-black font-mono my-2 block ${calculatedGrade.color}`}>{calculatedGrade.letter}</strong>
                    
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${calculatedGrade.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {calculatedGrade.status === 'Pass' ? 'ناجح ومؤهل للانتقال للمستوى التالي' : 'راسب ويستوجب تعيين دور ثاني مع مرشد'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Payroll calculation Rules (قوانين الرواتب) */}
                <div className="bg-transparent dark:bg-slate-950 border border-slate-150 p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/40 pb-2">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <strong className="text-xs font-black text-slate-800 dark:text-slate-200">4. بوابة الرواتب والمستحقات والخصومات الضريبية (Payroll Engine)</strong>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">الراتب الأساسي:</label>
                      <input 
                        type="number" step="100" min="4000" max="25000"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(Number(e.target.value))}
                        className="w-full px-2 py-1 dark:bg-slate-900 rounded text-xs font-bold font-mono text-center"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">البدلات (سكن ومواصلات):</label>
                      <input 
                        type="number" step="50" min="0" max="8000"
                        value={allowances}
                        onChange={(e) => setAllowances(Number(e.target.value))}
                        className="w-full px-2 py-1 dark:bg-slate-900 rounded text-xs font-bold font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">الاستقطاعات والغياب:</label>
                      <input 
                        type="number" step="50" min="0" max="5000"
                        value={deductions}
                        onChange={(e) => setDeductions(Number(e.target.value))}
                        className="w-full px-2 py-1 dark:bg-slate-900 rounded text-xs font-bold font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-black text-slate-500 block">ضريبة ساند / التأمينات (%):</label>
                      <input 
                        type="number" min="0" max="25"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(Number(e.target.value))}
                        className="w-full px-2 py-1 dark:bg-slate-900 rounded text-xs font-bold font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-950 text-white p-3 flex justify-between items-center text-xs font-bold font-mono">
                    <span className="text-amber-200">مسودة الحساب الضريبي: الراتب الإجمالي: {(basicSalary + allowances)} ريال | الاستقطاع الضريبي: {((basicSalary + allowances) * taxPercent / 100)} ريال</span>
                    <span className="text-emerald-400">صافي راتب الموظف المحول للبنك: {netSalary} ريال ✓</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: ACID TRANSACTIONS (المعاملات المالية الحساسة) */}
          {activeSubTab === 'acid' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>ثالثاً: محاكي المعاملات الحساسة والتأكد من تطبيق قوانين ACID</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">نموذج فحص عمليات التخزين المالي وإجراء التراجع التلقائي بنجاح في حالة الفشل المباغت</p>
              </div>

              {/* Educational info cards of ACID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <strong className="text-xs text-amber-600 dark:text-amber-400 block font-mono">Atomicity (الذرية)</strong>
                  <span className="text-[10px] text-slate-400 block font-bold leading-normal">الصفقة كتلة واحدة، إما تكتمل جميع خطواتها أو تفشل كلياً بدون بقايا.</span>
                </div>
                <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <strong className="text-xs text-amber-600 dark:text-amber-400 block font-mono">Consistency (الاتساق)</strong>
                  <span className="text-[10px] text-slate-400 block font-bold leading-normal">تتحرك الأرصدة والقيود من حالة محاسبية صحيحة إلى حالة صحيحة أخرى دوماً.</span>
                </div>
                <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <strong className="text-xs text-amber-600 dark:text-amber-400 block font-mono">Isolation (العزل)</strong>
                  <span className="text-[10px] text-slate-400 block font-bold leading-normal">تنفصل المعاملات المتزامنة لتفادي التداخل أو قراءة بيانات غير معتمدة مؤقتاً.</span>
                </div>
                <div className="p-2.5 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-1">
                  <strong className="text-xs text-amber-600 dark:text-amber-400 block font-mono">Durability (المثابرة)</strong>
                  <span className="text-[10px] text-slate-400 block font-bold leading-normal">تُحفظ النتائج بشكل نهائي بالخوادم ولا تزول مطلقاً حتى لو انقطع التيار فجأة.</span>
                </div>
              </div>

              {/* Transaction Simulator Sandbox */}
              <div className="p-5 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>منصة محاكاة العمليات الحساسة (ACID Sandbox Run)</span>
                  </h4>
                  <div className="flex gap-2 text-[10px] font-bold text-slate-450 font-mono">
                    <span>رصيد الصندوق بالخزينة: ${simulatedAccountBalance.toLocaleString()}</span>
                    <span>|</span>
                    <span>قيود القيود اليومية: {simulatedLedgerCount} قيداً</span>
                  </div>
                </div>

                <div className="dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-250 block">خيارات الفحص والتحقق من التراجع التلقائي (Rollback Scenario):</span>
                  
                  <div className="flex items-center justify-between bg-transparent dark:bg-slate-950 p-3 rounded-lg border border-slate-150 text-xs">
                    <div className="space-y-0.5">
                      <strong className="font-extrabold text-slate-800 dark:text-slate-200 block">افتعال خطأ بالخطوة الثالثة لترحيل الدفاتر (Simulate Failure at Ledger Entry)</strong>
                      <p className="text-[11px] text-slate-400 font-bold">يفيد في اختبار مبدأ الذرية ككتلة واحدة (أما الكل أو لا شيء)</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFailStep3(!failStep3)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-black transition-colors cursor-pointer ${failStep3 ? 'bg-rose-150 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}
                    >
                      {failStep3 ? 'فشل مصطنع نشط (تراجع كلي)' : 'خط سير طبيعي ناجح (حفظ نهائي)'}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={acidStatus === 'step1' || acidStatus === 'step2' || acidStatus === 'step3'}
                    onClick={runAcidTransaction}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-amber-400 py-3 px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تشغيل المعاملة المالية وفق شروط ACID</span>
                  </button>
                </div>

                {/* ACID Live Logs Monitor */}
                <div className="bg-slate-900 p-4 text-white space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>مراقب تتبع خادم المعاملات (ACID Transaction Live Console)</span>
                    <span className="animate-pulse flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      مراقب نشط
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-2 text-right">
                    {acidLogs.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px]">بانتظار تشغيل محاكي المعاملات بالأعلى للرصد الفوري...</p>
                    ) : (
                      acidLogs.map((log, index) => {
                        let color = 'text-slate-300';
                        if (log.includes('فشل') || log.includes('خطأ') || log.includes('ROLLBACK')) color = 'text-rose-400 font-bold';
                        if (log.includes('بنجاح') || log.includes('COMMIT')) color = 'text-emerald-400 font-bold';
                        return (
                          <div key={index} className={`text-[11px] leading-relaxed ${color}`}>
                            {log}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: VALIDATION GUARDRAILS (التحقق وحراسة المدخلات) */}
          {activeSubTab === 'validation' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                  <span>رابعاً: التحقق من المدخلات ومنع البيانات غير الصحيحة قبل الحفظ</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">حراسة صارمة على حقول الإدخال وصياغة رسائل توجيهية فورية للمستخدم لمنع الأخطاء</p>
              </div>

              <p className="text-xs text-slate-550 leading-relaxed font-medium">
                تم دمج بوابات التحقق في مستوى الـ Front-end والـ Back-end لمراقبة المدخلات والتصدي للبيانات الخاطئة (مثال: الأعمار الخاطئة للطلاب، الجوالات غير المكتملة، والأسماء الثنائية القصيرة).
              </p>

              {/* Validation Sandbox Form */}
              <div className="p-5 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-4">
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block uppercase">لوحة اختبار صلاحية حقول التسجيل والقبول (Validation Test Bench):</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black text-slate-500 block">اسم الطالب ثلاثي بالكامل:</label>
                    <input 
                      type="text" placeholder="مثال: صالح محمد المري" 
                      value={testFullName}
                      onChange={(e) => setTestFullName(e.target.value)}
                      className="w-full px-3 py-2 dark:bg-slate-900 dark:border-slate-800 text-xs font-semibold text-right"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">القيد: لا يقل عن 3 مقاطع (7 أحرف كحد أدنى)</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black text-slate-500 block">العمر السنوي للطالب:</label>
                    <input 
                      type="number" 
                      value={testAge}
                      onChange={(e) => setTestAge(Number(e.target.value))}
                      className="w-full px-3 py-2 dark:bg-slate-900 dark:border-slate-800 text-xs font-semibold text-right font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">القيد النطاقي (Range Check): يتراوح بين 5 سنوات و 19 سنة.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black text-slate-500 block">رقم جوال ولي الأمر (بصيغة المملكة):</label>
                    <input 
                      type="text" placeholder="مثال: 0512345678" 
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full px-3 py-2 dark:bg-slate-900 dark:border-slate-800 text-xs font-semibold text-right font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">القيد التنسيقي (Format Check): يبدأ بـ 05 ويتكون من 10 أرقام.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black text-slate-500 block">رقم الهوية الوطنية / الإقامة:</label>
                    <input 
                      type="text" placeholder="مثال: 1029384756" 
                      value={testNationalIdInput}
                      onChange={(e) => setTestNationalIdInput(e.target.value)}
                      className="w-full px-3 py-2 dark:bg-slate-900 dark:border-slate-800 text-xs font-semibold text-right font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">القيد: يجب أن يتكون من 10 خانات رقمية تامة.</span>
                  </div>

                </div>

                {/* Validation triggers */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setTestFullName('عمر الحربي'); // short
                      setTestAge(3); // out of range
                      setTestPhone('04123456'); // invalid prefix & length
                      setTestNationalIdInput('123'); // too short
                    }}
                    className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg text-[10px] font-black cursor-pointer"
                  >
                    تعبئة بيانات خاطئة للاختبار
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestFullName('سليمان خالد العتيبي');
                      setTestAge(15);
                      setTestPhone('0599998888');
                      setTestNationalIdInput('1098273645');
                    }}
                    className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-black cursor-pointer"
                  >
                    تعبئة بيانات صحيحة ومثالية
                  </button>
                  <button
                    type="button"
                    onClick={handleValidateForm}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>تشغيل الفحص والتحقق قبل الحفظ</span>
                  </button>
                </div>

                {/* Live Validation Alert List */}
                {validationErrors.length > 0 && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 text-xs space-y-2 text-right">
                    <strong className="text-rose-800 dark:text-rose-300 font-black flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>تم حظر الحفظ لوجود عيوب إدخال ({validationErrors.length}) سجل:</span>
                    </strong>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Console Output */}
                <div className="bg-slate-900 p-4 text-white space-y-2 font-mono text-xs">
                  <span className="text-[10px] text-amber-400 block uppercase">سجل بوابة الحراسة البرمجية (Validation Engine Log):</span>
                  <div className="space-y-1 text-right text-[11px]">
                    {validationLogs.map((log, i) => (
                      <p key={i} className="text-slate-300">
                        <span className="text-emerald-400 font-bold">▶</span> {log}
                      </p>
                    ))}
                    {validationLogs.length === 0 && (
                      <p className="text-slate-500 italic">انقر على "تشغيل الفحص والتحقق قبل الحفظ" لمتابعة الأكواد...</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: CERTIFICATION & SCORES (خامساً: بطاقة الاعتماد والدرجات الكلية) */}
          {activeSubTab === 'cert' && (
            <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    <span>خامساً: بطاقة تقييم واعتماد سلامة البيانات وقواعد الأعمال بالمنظومة</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">إسناد الدرجات والتقييمات التفاعلية لكل من محاور الأمان وصلاحية البيانات</p>
                </div>
                <span className="bg-amber-50 dark:bg-amber-950 text-amber-600 text-[10px] font-black px-2.5 py-1 rounded-md">
                  معايير التدقيق v2.0
                </span>
              </div>

              {/* Dynamic Interactive Sliders for Scores */}
              <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-150 space-y-5">
                <strong className="text-[11px] font-black text-slate-450 block uppercase">لوحة تعديل درجات الامتثال يدوياً ومراجعة تأثير التقييم الكلي:</strong>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">سلامة واكتمال البيانات (Data Integrity)</span>
                      <span className="text-amber-600 font-mono font-black">{scores.dataIntegrity}/100</span>
                    </div>
                    <input 
                      type="range" min="60" max="100" 
                      value={scores.dataIntegrity}
                      onChange={(e) => setScores(prev => ({ ...prev, dataIntegrity: Number(e.target.value) }))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">يشمل: صحة المفاتيح، العلاقات المرجعية الفريدة، CASCADE DELETE.</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">قواعد الأعمال والاحتساب (Business Rules)</span>
                      <span className="text-amber-600 font-mono font-black">{scores.businessRules}/100</span>
                    </div>
                    <input 
                      type="range" min="60" max="100" 
                      value={scores.businessRules}
                      onChange={(e) => setScores(prev => ({ ...prev, businessRules: Number(e.target.value) }))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">يشمل: الرسوم، الأقساط، الدفاتر المزدوجة، الرواتب، التقديرات.</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">التحقق من المدخلات والحراسة (Validation)</span>
                      <span className="text-amber-600 font-mono font-black">{scores.validation}/100</span>
                    </div>
                    <input 
                      type="range" min="60" max="100" 
                      value={scores.validation}
                      onChange={(e) => setScores(prev => ({ ...prev, validation: Number(e.target.value) }))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">يشمل: حظر القيم غير الصحيحة، أطوال الأسماء، صيغ الهواتف.</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">سلامة المعاملات وعزل الأرصدة (Transaction Safety)</span>
                      <span className="text-amber-600 font-mono font-black">{scores.transactionSafety}/100</span>
                    </div>
                    <input 
                      type="range" min="60" max="100" 
                      value={scores.transactionSafety}
                      onChange={(e) => setScores(prev => ({ ...prev, transactionSafety: Number(e.target.value) }))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">يشمل: معايير ACID الأربعة، آليات الالتزام والتراجع التلقائي.</p>
                  </div>

                </div>
              </div>

              {/* Dynamic Certificate Preview Mockup */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-amber-950 border-2 border-amber-400/40 rounded-3xl p-6 text-white text-center space-y-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

                <div className="flex justify-center">
                  <Award className="w-12 h-12 text-amber-400 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-amber-400 tracking-wide">وثيقة اعتماد سلامة البيانات وقواعد الأعمال بالمدارس الذكية</h4>
                  <span className="text-[9.5px] text-slate-300 block">Enterprise Data & Business Rules Excellence Program</span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-semibold max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  تُقر الهيئة التقنية العليا بأن المنصة التعليمية قد اجتازت كافة فحوصات التكامل ومكافحة البيانات اليتيمة والتكرار، مع تفعيل حراسة المدخلات ومعالجة الصفقات وفق بروتوكولات ACID الصارمة وحساب الأجور والأقساط بنسبة امتثال تراكمية تبلغ:
                </p>

                <div className="py-2.5 px-6 bg-slate-950/75 border border-slate-800 inline-block">
                  <span className="text-xs text-slate-400 block font-bold">مجموع درجات الاعتماد الكلي</span>
                  <strong className="text-3xl font-black font-mono text-emerald-400 mt-0.5 block">{overallScore} / 100</strong>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-400 max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  <span>المعرف الرقمي: <span className="font-mono">DB-BIZ-CERT-992</span></span>
                  <span>تاريخ الاعتماد: {new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* LEFT PANEL: Interactive Checklists of verified features */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* Detailed Verification Checklist */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              <span>مراجعة بنود التدقيق الكلي (Audit Items)</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              تفقد قائمة المعايير البرمجية المفروضة للتأكد من تفعيلها التام في الكود المصدري للمنصة:
            </p>

            <div className="space-y-2.5">
              
              {/* Category 1 */}
              <div className="space-y-1.5">
                <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-black block w-fit">
                  سلامة البيانات (Data Integrity)
                </span>
                
                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>العلاقات المرجعية (Primary/Foreign Keys)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>منع البيانات اليتيمة (No Orphan Records)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>منع تكرار الهويات والبيانات الشخصية</span>
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-black block w-fit">
                  قواعد الأعمال (Business Rules)
                </span>
                
                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>احتساب الرسوم والخصومات تلقائياً</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>توليد أقساط السداد ومطابقة التحصيل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>توازن ميزان مراجعة القيود اليومية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>توزيع التقديرات التلقائي للامتحانات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>حساب الرواتب والضرائب والبدلات بدقة</span>
                  </div>
                </div>
              </div>

              {/* Category 3 */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                <span className="text-[9px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-md font-black block w-fit">
                  المعاملات والتحقق (TX & Validation)
                </span>
                
                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>حماية الذرية (All-or-Nothing ACID)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>حراسة الحقول ومنع الأخطاء مبكراً</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>صياغة رسائل تحذير واضحة قبل الحفظ</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Stats card */}
          <div className="bg-transparent dark:bg-slate-950 p-4 border border-slate-150 space-y-3">
            <strong className="text-[11px] font-black text-slate-450 block uppercase">توصيات مراجع التدقيق المعماري:</strong>
            <p className="text-[11.5px] text-slate-550 leading-relaxed font-semibold text-right">
              ينصح النظام باستخدام قفل التحديث المتفائل (Optimistic Locking) لمعاملات التحصيل المالي المباشرة وتفعيل قيود فحص النطاق (Check Constraints) على مستوى محرك قاعدة البيانات (Firestore rules) لمزيد من الكفاءة ومقاومة الأخطاء.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
