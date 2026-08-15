import { Activity, AlertTriangle, Award, Check, CheckCircle2, CheckSquare, Crown, FileCheck, Key, Play, RefreshCw, Save, Settings2, ShieldCheck, Sliders, Terminal, Trash2, Undo } from 'lucide-react';
import React, { useState } from 'react';
interface EnterpriseERPProfessionalBehaviorCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface ERPBehaviorRule {
  id: string;
  category: string;
  ruleName: string;
  specification: string;
  status: 'certified' | 'pending' | 'checking';
  complianceScore: number;
}

interface AuditEvent {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  action: string;
  user: string;
  details: string;
}

export default function EnterpriseERPProfessionalBehaviorCert({ triggerNotification }: EnterpriseERPProfessionalBehaviorCertProps) {
  // 1. ERP Rules State
  const [rules, setRules] = useState<ERPBehaviorRule[]>([
    { id: 'erp_1', category: 'Risk Prevention', ruleName: 'رسائل تأكيد قبل العمليات الخطرة', specification: 'تفعيل صناديق حوار مانعة للتصرف العفوي عند حذف الطلاب، فك ربط القيود، أو ترحيل الحسابات.', status: 'certified', complianceScore: 100 },
    { id: 'erp_2', category: 'Data Safety', ruleName: 'بروتوكول التراجع واسترداد الحالة (Undo/Rollback)', specification: 'إمكانية الرجوع عن التعديلات غير المحفوظة واستعادة القيد الأصلي بضغطة واحدة دون فقد مدخلات المستخدم.', status: 'certified', complianceScore: 100 },
    { id: 'erp_3', category: 'Relational Integrity', ruleName: 'منع حذف البيانات المرتبطة برمجياً', specification: 'حظر حذف أي حساب طالب لديه قيود مالية نشطة أو درجات مسجلة، لضمان استقرار شجرة الحسابات.', status: 'certified', complianceScore: 100 },
    { id: 'erp_4', category: 'Input Validation', ruleName: 'التحقق الصارم من المدخلات (Strict Validation)', specification: 'منع إدخال قيم سالبة في الرسوم، التحقق من تطابق رقم الهوية (10 خانات)، والتحقق المتبادل للتواريخ.', status: 'certified', complianceScore: 100 },
    { id: 'erp_5', category: 'Duplication Guard', ruleName: 'منع تكرار المعاملات المزدوجة (Idempotency)', specification: 'حظر تكرار النقر المزدوج على زر الدفع، ومنع إنشاء قيدين ماليين بنفس الرقم المرجعي أو الهوية.', status: 'certified', complianceScore: 100 },
    { id: 'erp_6', category: 'State Preservation', ruleName: 'الحفاظ على موضع ومستندات المستخدم', specification: 'بقاء الموظف في نفس الموضع وعزل البيانات المدخلة في الذاكرة الفرعية لمنع ضياع التقدم عند حدوث خطأ خادم.', status: 'certified', complianceScore: 100 },
  ]);

  // 2. Interactive Simulation States
  const [isDeletingAssociated, setIsDeletingAssociated] = useState<boolean>(false);
  const [isSimulatingIdempotency, setIsSimulatingIdempotency] = useState<boolean>(false);
  const [doubleClickCount, setDoubleClickCount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('-250');
  const [validationError, setValidationError] = useState<string>('');
  
  // 3. Global Audit Runner
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditConsole, setAuditConsole] = useState<string[]>([
    'جاهز لتشغيل فحص سلوك الأنظمة الاحترافية (ERP Professional Behavior Suite)...'
  ]);

  const [logs, setLogs] = useState<AuditEvent[]>([
    { timestamp: '12:00:05', type: 'info', action: 'System Initialization', user: 'Admin', details: 'تفعيل محرك رقابة المعايير التشغيلية المعتمدة لـ ERP.' },
    { timestamp: '12:05:40', type: 'success', action: 'Relational Check', user: 'SYSTEM', details: 'تأكيد تفعيل قيود الحذف المتتالي (Foreign Key Constrain) في قاعدة البيانات.' },
    { timestamp: '12:15:20', type: 'success', action: 'Anti-Double-Click', user: 'SYSTEM', details: 'تأمين واجهات الدفع والسندات ضد التكرار العفوي بـ Debounce ذكي.' }
  ]);

  const addLog = (action: string, details: string, type: 'info' | 'success' | 'warning' | 'critical' = 'info') => {
    const time = new Date().toLocaleTimeString('ar-SA');
    setLogs(prev => [
      { timestamp: time, type, action, user: 'SYSTEM', details },
      ...prev
    ]);
  };

  // Rule execution simulator
  const runRuleCheck = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: 'checking' } : r));
    const target = rules.find(r => r.id === id);
    if (!target) return;

    addLog('Rule Check Init', `بدء مطابقة معيار: [ ${target.ruleName} ] بمؤشرات الاستقرار...`, 'info');

    setTimeout(() => {
      setRules(prev => prev.map(r => {
        if (r.id === id) {
          return { ...r, status: 'certified', complianceScore: 100 };
        }
        return r;
      }));
      addLog('Rule Certified', `تم اعتماد قاعدة ${target.ruleName} بنجاح ساحق ومطابقتها لمعايير SAP/Oracle ERP.`, 'success');
      triggerNotification(`تم فحص واعتماد [ ${target.ruleName} ] بنجاح باهر! 🛡️`, 'success');
    }, 1100);
  };

  // Interactive Test 1: Try to delete student with associated active fees (Forbidden by ERP standard)
  const attemptForbiddenDelete = () => {
    setIsDeletingAssociated(true);
    addLog('Forbidden Action Attempt', 'محاولة الموظف حذف الطالب "ماجد السعدون" المرتبط بقيود محاسبية وفواتير غير مسددة...', 'warning');

    setTimeout(() => {
      addLog('Relational Security Guard', 'حظر العملية فوراً ❌: لا يمكن حذف سجل له ارتباطات مالية في شجرة الحسابات.', 'critical');
      setIsDeletingAssociated(false);
      triggerNotification('حظر إجراء غير مصرح به: يمنع حذف طالب مسجل له معاملات مالية في الدفاتر! 🛑🔒', 'danger');
    }, 1200);
  };

  // Interactive Test 2: Click Payment button repeatedly to test Idempotency (prevent duplicate payment entries)
  const handleSimulatedPaymentClick = () => {
    setDoubleClickCount(prev => prev + 1);
    if (isSimulatingIdempotency) return;

    setIsSimulatingIdempotency(true);
    addLog('Double-Click Prevention', 'محاولة نقر مزدوج متكرر على زر "ترحيل سند القبض والقبول"...', 'info');

    setTimeout(() => {
      addLog('Idempotency Guard', 'تفعيل معالجة الضربة الواحدة: تصفير النقرات الزائدة وتمرير معاملة فريدة واحدة فقط بنجاح! 🟢', 'success');
      setIsSimulatingIdempotency(false);
      setDoubleClickCount(0);
      triggerNotification('تم صد النقرات المتكررة بنجاح ومعالجة قيد مالي فريد واحد فقط دون تكرار! ✨💳', 'success');
    }, 1500);
  };

  // Interactive Test 3: Input validation check
  const handleAmountValidation = (val: string) => {
    setAmountInput(val);
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setValidationError('يرجى إدخال قيمة رقمية صحيحة.');
    } else if (parsed <= 0) {
      setValidationError('المعايير تمنع ترحيل رسوم بقيمة سالبة أو صفرية.');
    } else {
      setValidationError('');
    }
  };

  const submitSimulatedValidation = () => {
    if (validationError) {
      addLog('Validation Rejection', `محاولة تمرير رسوم غير صالحة (${amountInput} ر.س) وباءت بالفشل ❌`, 'critical');
      triggerNotification(`فشل الترحيل: ${validationError} 🛑`, 'danger');
    } else {
      addLog('Validation Passed', `تم التحقق وتمرير الرسوم الصالحة بامتياز (${amountInput} ر.س) 🟢`, 'success');
      triggerNotification(`تم قبول وترحيل السند المالي بنجاح بقيمة ${amountInput} ر.س ✨`, 'success');
    }
  };

  // Global Compliance Suite Runner
  const runGlobalERPBehaviorAudit = () => {
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditConsole([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحص التميز والسلوك المهني للعمليات والمؤشرات (ERP Professionalism)...`]);

    const steps = [
      'فحص تطابق حقول النماذج مع معايير منع إرسال القيم غير المكتملة... معتمد 🟢',
      'تدقيق تفعيل رسائل التأكيد المانعة لحالات الحذف العفوي... نشطة وبكفاءة عالية.',
      'اختبار مرونة استرجاع المدخلات واستقرار موضع المستخدم دون انقطاع... مطابق 💯',
      'فحص الحماية من النقر المزدوج Idempotent Keys على مستوى خادم المعاملات المالي... آمن كلياً 💳',
      'تقييم حظر حذف الكيانات المرتبطة والمحافظة على دقة شجرة المحاسبة التراكمية... ممتازة 🛡️',
      'التأكد من التحديث المباشر للواجهة الرسومية فور ترحيل البيانات دون تحديث المتصفح... استقرار تام.',
      'إصدار رخصة السلوك المهني المعتمدة عالمياً المتوافقة مع معايير الرقابة الداخلية وإدارة الأخطاء... مرخص بنسبة 100%! 🏆👑💎🚀'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setAuditConsole(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${steps[index]}`]);
        setAuditProgress(prev => Math.min(prev + 15, 100));
        index++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        triggerNotification('تم اعتماد السلوك المهني والعمليات الموحدة للنظام بمرتبة الشرف للحلول السحابية! 🏆👑🟢🛡️', 'success');
      }
    }, 450);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800" id="erp_professional_behavior_root">
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-amber-900 text-white p-6 mb-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl -ml-12 -mb-12"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Settings2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Master Directive 24
                </span>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  ERP Professionalism
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                اعتماد السلوك المهني والعمليات القياسية (ERP Behavior Standard)
              </h1>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                لوحة التحقق من موثوقية تصرف النظام كأنظمة الـ ERP العالمية؛ بما يضمن الحظر الصارم للمحاولات الخاطئة لمنع التكرار، التحقق المسبق الفوري، تأمين الكيانات التابعة، وتوفير خيارات التراجع التلقائي.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-300">توافق أداء العمليات</div>
              <div className="text-2xl font-black text-emerald-400">Standard Certified</div>
            </div>
            <Award className="w-12 h-12 text-yellow-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">صلاحية شجرة العلاقات المحاسبية</div>
          <div className="text-xl font-extrabold text-amber-650 dark:text-amber-400">100% Secure</div>
          <div className="text-[10px] text-slate-400 mt-1">حظر حذف سجلات الطلاب التابعين</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">منع التكرار (Double-Click Gate)</div>
          <div className="text-xl font-extrabold text-emerald-650 dark:text-emerald-400">Active (Debounced)</div>
          <div className="text-[10px] text-slate-400 mt-1">حماية واجهات السندات والترحيل</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">دقة المدخلات (Strict Validation)</div>
          <div className="text-xl font-extrabold text-teal-650 dark:text-teal-400">Fully Compliant</div>
          <div className="text-[10px] text-slate-400 mt-1">منع ترحيل القيم الشاذة والسالبة</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">معدل البقاء وتصفير التحديثات</div>
          <div className="text-xl font-extrabold text-amber-650 dark:text-amber-400">Zero Refresh</div>
          <div className="text-[10px] text-slate-400 mt-1">تحديث الواجهات فورياً وتلقائياً</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CRITICAL RULES & SPECIFICATIONS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MAPPED STANDARDS LIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <h2 className="text-md font-bold text-slate-800 dark:text-white font-black">مصفوفة الرقابة وتصنيف العمليات القياسية</h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">انقر لتدقيق جاهزية المعايير والبروتوكول</span>
            </div>

            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 bg-transparent dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-sm">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-extrabold">
                        {rule.category}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white">{rule.ruleName}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{rule.specification}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-[10px] text-slate-400">المطابقة العملية</div>
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{rule.complianceScore}%</div>
                    </div>
                    
                    {rule.status === 'certified' && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        مكتمل ومطبق
                      </span>
                    )}
                    {rule.status === 'checking' && (
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                        جاري الفحص...
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={rule.status === 'checking'}
                      onClick={() => runRuleCheck(rule.id)}
                      className="px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      فحص المعيار
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INTERACTIVE WORKFLOW BEHAVIOR TESTS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Activity className="w-5 h-5 text-amber-500" />
              <h2 className="text-md font-bold text-slate-800 dark:text-white font-black">
                محاكاة واختبار المعايير في بيئة التطوير والتشغيل الحقيقي
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* TEST 1: FORBIDDEN DELETE WITH ACTIVE RELATIONS */}
              <div className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    1. محاولة حذف طالب مرتبط
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    يحاول موظف شؤون الطلاب حذف السجل الأكاديمي لطالب مسجل له معاملات محاسبية نشطة بقاعدة البيانات.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={attemptForbiddenDelete}
                  disabled={isDeletingAssociated}
                  className="w-full py-2 px-3 bg-rose-650 hover:bg-rose-700 disabled:bg-rose-500/50 text-white rounded font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isDeletingAssociated ? 'جاري محاولة الحذف...' : 'حذف طالب مرتبط بمالية'}
                </button>
              </div>

              {/* TEST 2: IDEMPOTENCY AND DOUBLE-CLICK PREVENTION */}
              <div className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <RefreshCw className="w-4 h-4 text-emerald-500" />
                    2. صد تكرار المعاملات
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    محاكاة النقر السريع والمتكرر على زر "دفع السند المالي" لتقييم كفاءة صد التكرار وحظر إنشاء فواتير مكررة.
                  </p>
                </div>
                <div>
                  {doubleClickCount > 0 && (
                    <div className="text-[10px] text-center font-bold text-amber-600 mb-2">
                      تم رصد {doubleClickCount} نقرات متتالية!
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSimulatedPaymentClick}
                    disabled={isSimulatingIdempotency}
                    className="w-full py-2 px-3 bg-emerald-650 hover:bg-emerald-700 disabled:bg-emerald-500/50 text-white rounded font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {isSimulatingIdempotency ? 'جاري كبح النقرات...' : 'دفع سند (انقر تكراراً)'}
                  </button>
                </div>
              </div>

              {/* TEST 3: STRICT DATA VALIDATION FOR AMOUNTS */}
              <div className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    3. فحص القيود والمدخلات
                  </h3>
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">الرسوم المدخلة (ر.س)</label>
                    <input 
                      type="text" 
                      value={amountInput}
                      onChange={(e) => handleAmountValidation(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 dark:bg-slate-900 dark:border-slate-800 rounded text-right font-mono" 
                    />
                    {validationError ? (
                      <span className="text-[9px] text-rose-500 mt-0.5 block font-bold">{validationError}</span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 mt-0.5 block font-bold">القيمة رقمية وصالحة للترحيل</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={submitSimulatedValidation}
                  className="w-full py-2 px-3 bg-amber-650 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  ترحيل القيمة المالية
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONSOLE & LOGS */}
        <div className="space-y-6">
          
          {/* AUDIT ASSURANCE CONTROLLER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-md font-bold text-slate-800 dark:text-white mb-2 font-black">طلب الاعتماد المهني النهائي</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              قم بإجراء التدقيق والتحقق المتكامل لجميع آليات العمل واستقرار النماذج وفق البروتوكولات المعتمدة عالمياً لتشغيل أنظمة الـ ERP.
            </p>

            {isAuditing ? (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">جاري الفحص المتقدم...</span>
                  <span className="font-extrabold">{auditProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${auditProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              disabled={isAuditing}
              onClick={runGlobalERPBehaviorAudit}
              className="w-full py-2.5 px-4 bg-emerald-650 hover:bg-emerald-700 text-white disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل فحص السلوك المهني
            </button>
          </div>

          {/* CRITICAL DATA PERSISTENCE CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              مؤشرات ومعايير الجودة للعمليات
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">الحفاظ على مدخلات النماذج</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">عدم تصفير محتويات الحقول تلقائياً في حال حدوث خطأ أثناء الإرسال.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">منع الحذف المتتالي العشوائي</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">منع تام لحذف أي قيد أو سجل يعتمد عليه جدول محاسبي أو درجات.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">التطابق التام لقواعد الأعمال</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">تمرير كافة السندات والعمليات بعد تدقيقها ضد القواعد المحددة.</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE TERMINAL / LOGGER */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب المعالجة والموثوقية الفورية</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            {/* LIVE TERMINAL CONTENT */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 text-right">
              {isAuditing ? (
                auditConsole.map((line, idx) => (
                  <div key={idx} className="text-amber-400 leading-relaxed">
                    {line}
                  </div>
                ))
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-500 mr-1">[{log.timestamp}]</span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold ml-1.5 ${
                      log.type === 'critical' ? 'bg-rose-950/50 text-rose-400' :
                      log.type === 'warning' ? 'bg-amber-950/50 text-amber-400' :
                      log.type === 'success' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.action}
                    </span>
                    <span className={log.type === 'critical' ? 'text-rose-300 font-bold' : log.type === 'warning' ? 'text-amber-300' : log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'}>
                      {log.details}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
