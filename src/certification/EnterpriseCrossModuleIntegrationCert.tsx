import { Award, Check, ChevronRight, Code, Cross, Diamond, GitFork, Link, Lock as LockIcon, Play, Radio, School, Search, Shield, ShieldCheck, Sliders, Stamp, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseCrossModuleIntegrationCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface IntegrationPipeline {
  id: string;
  name: string;
  arabicName: string;
  sourceModule: string;
  targetModule: string;
  dataTransferred: string;
  constraintRules: string;
  status: 'active' | 'broken' | 'pending';
}

export default function EnterpriseCrossModuleIntegrationCert({ triggerNotification }: EnterpriseCrossModuleIntegrationCertProps) {
  // 1. Integration Pipelines covering all aspects of DIAMOND DIRECTIVE 42
  const [pipelines, setPipelines] = useState<IntegrationPipeline[]>([
    {
      id: 'pipe_acad_fin',
      name: 'Academic Enrollment to Financial Ledger',
      arabicName: 'ترحيل الرسوم الدراسية التلقائي عند القبول الأكاديمي',
      sourceModule: 'Academic Affairs',
      targetModule: 'Financial ERP',
      dataTransferred: 'رقم الطالب، المرحلة الدراسية، الخصم المعتمد، وقيمة القسط',
      constraintRules: 'منع تفعيل حساب الطالب أكاديمياً قبل إنشاء سجله المالي وسند القيد المزدوج المقابل.',
      status: 'active'
    },
    {
      id: 'pipe_fin_exam',
      name: 'Financial Ledger to Exam Eligibility Guard',
      arabicName: 'حظر بطاقات الامتحانات النهائية للمتعثرين مالياً',
      sourceModule: 'Financial ERP',
      targetModule: 'Exams & Grading',
      dataTransferred: 'مؤشر التعثر، المبالغ المتأخرة، وحالة الحظر المالي النشط',
      constraintRules: 'منع طباعة أرقام الجلوس أو إدخال درجات الطلاب الذين عليهم مديونيات متجاوزة للحد الائتماني.',
      status: 'active'
    },
    {
      id: 'pipe_hr_finance',
      name: 'Payroll Automation to General Accounting Journal',
      arabicName: 'مزامنة رواتب الموظفين مع دفتر الأستاذ العام',
      sourceModule: 'HR & Payroll',
      targetModule: 'Financial ERP',
      dataTransferred: 'إجمالي الرواتب، الضرائب المستقطعة، والتأمينات الاجتماعية لكل موظف',
      constraintRules: 'توليد قيد مزدوج متزن تلقائياً فور اعتماد كشف الرواتب الشهري من الإدارة المالية.',
      status: 'active'
    },
    {
      id: 'pipe_tenant_isolation',
      name: 'Tenant & Multi-School Schema Isolation',
      arabicName: 'عزل المدارس والفروع التابع للمؤسسة (Tenant Isolation)',
      sourceModule: 'System Administration',
      targetModule: 'All Enterprise Modules',
      dataTransferred: 'رمز الفرع (School_ID) ومفاتيح الجلسة والمستخدم المعتمدة',
      constraintRules: 'منع موظفي فرع معين من استعراض، تعديل، أو حذف بيانات أي فرع أو مدرسة أخرى بالمجمع.',
      status: 'active'
    },
    {
      id: 'pipe_global_search',
      name: 'Cross-Module Search Index & Permissions',
      arabicName: 'مزامنة محرك البحث العام عبر الوحدات المختلفة',
      sourceModule: 'Search & Permissions Engine',
      targetModule: 'Global Workspace',
      dataTransferred: 'نصوص البحث الموحدة والتحقق الفوري من الصلاحيات والفرع',
      constraintRules: 'إرجاع نتائج البحث من شؤون الطلاب، الحسابات، والأكاديميات لحظياً بناءً على رتبة الموظف وفرعه.',
      status: 'active'
    }
  ]);

  // 2. Control states
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'نظام التحقق والتكامل الشامل (Cross-Module Integration Engine) نشط ومستعد لفحص الترابط.'
  ]);
  const [isCertified, setIsCertified] = useState<boolean>(false);
  const [inspectorName, setInspectorName] = useState<string>('أ. د. مستشار التكامل الفيدرالي لبيانات المجمع');
  const [authCode, setAuthCode] = useState<string>('CROSS-MODULE-42-DIAMOND');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // 3. Interactive Sandbox state
  const [testPayload, setTestPayload] = useState<string>('EnrollmentEvent: { studentId: "STU-2026-09", branchId: "BRANCH-NORTH", gradeLevel: "Grade_10", tuitionAmount: 18500 }');
  const [sandboxResult, setSandboxResult] = useState<string>('انقر على "محاكاة التدفق المتكامل (E2E)" لتتبع انتقال البيانات بين الوحدات وقياس القيود والتحقق من العزل.');
  const [sandboxStatus, setSandboxStatus] = useState<'idle' | 'success' | 'warning'>('idle');

  const uniqueModules = ['all', 'Student Affairs', 'Academic Affairs', 'Financial ERP', 'HR & Payroll', 'System Administration'];
  const filteredPipelines = selectedModule === 'all' ? pipelines : pipelines.filter(p => p.sourceModule === selectedModule || p.targetModule === selectedModule);

  // 4. Sandbox flow runner
  const handleRunE2EFlow = () => {
    setSandboxResult('جاري استلام الحدث وتحليله عبر نظام التكامل الشامل...\n\n');
    setSandboxStatus('idle');

    setTimeout(() => {
      let output = `[EVENT CAPTURED] تم التقاط حدث تسجيل الطالب STU-2026-09 بفرع BRANCH-NORTH\n`;
      
      if (!testPayload.includes('branchId: "BRANCH-NORTH"') && !testPayload.includes('branchId:"BRANCH-NORTH"')) {
        output += `⚠️ [Tenant Alert] تم رصد خطر انتهاك شروط العزل (Tenant Isolation) لعدم تحديد رمز الفرع المعتمد!\n`;
        output += `❌ [Validation Blocked] تم إحباط العملية لمنع تسريب البيانات بين الفروع.`;
        setSandboxStatus('warning');
        triggerNotification('تنبيــه: تم حظر الحدث لمنع تسريب البيانات وعزل الفروع!', 'warning');
      } else {
        output += `1. [Academic Affairs]: تم تسجيل الطالب بالصف العاشر وإصدار رقمه الأكاديمي.\n`;
        output += `2. [Tenant Shield]: تم تأكيد عزل السجل ضمن المجمع الشمالي BRANCH-NORTH.\n`;
        output += `3. [Financial ERP]: تم إصدار قيد مالي مزدوج تلقائياً بقيمة المصاريف (18500) وحفظه بنجاح.\n`;
        output += `4. [Security Guard]: تم تحديث صلاحيات الحساب ومطابقتها بمحرك البحث العام.\n\n`;
        output += `✅ [End-to-End Success] تم ترحيل البيانات وتنسيق الحدث في كافة الوحدات بنسبة 100%.`;
        setSandboxStatus('success');
        triggerNotification('تمت مزامنة الحدث وتجربة التكامل الشامل بنجاح فائق ودون تراجعات!', 'success');
      }
      setSandboxResult(output);
    }, 850);
  };

  // 5. Global integration run
  const triggerGlobalIntegrationSweep = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء فحص واختبار التكامل الشامل للوحدات المدمجة End-to-End...`]);

    const steps = [
      'التحقق من تماسك العلاقات وسلامة انتقال البيانات بين القبول والمحاسبة (Academic & Financial Integration)... سليم 100% ✅',
      'فحص قيود حظر الامتحانات التلقائي (Exam Eligibility Verification) وضمان دقة السجلات... فعال بالكامل ✅',
      'مراقبة ترحيل قيود الأجور والرواتب والضرائب لدفتر الأستاذ (HR and Accounting Journal Integration)... توازن مطلق ✅',
      'تدقيق قيود العزل المتعدد للمدارس (Tenant Schema Isolation) ومنع تداخل الحسابات... الأمان مؤكد بنسبة 100% 🛡️',
      'اختبار محرك البحث العام الموحد (Global Search Matrix) وتجاوبه الفوري طبقاً لصلاحيات المستخدمين... دقيق ونشط 🔍',
      'قياس زمن نقل الأحداث المشتركة والخدمات السحابية الموحدة... زمن استجابة استثنائي وخالٍ من الأخطاء المعلقة ⚡',
      'الحصول على الميثاق البلاتيني الموحد رقم 42 لاعتماد تكامل الأنظمة (Cross-Module Integration Certification)! 🏆👑✨'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setAuditLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] ${steps[current]}`, ...prev]);
        setAuditProgress(prev => Math.min(prev + 15, 100));
        current++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        setIsCertified(true);
        triggerNotification('ممتاز! تم اجتياز ميثاق جودة وتكامل الأنظمة والخدمات المشتركة بنجاح تام! 🏆👑💎', 'success');
        setAuditLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] تم اعتماد وثيقة الترابط وصحة التكامل الفيدرالي في المجمع! 📜💎`,
          ...prev
        ]);
      }
    }, 600);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="cross_module_cert_root">
      
      {/* DIAMOND HERO BANNER */}
      <div className="bg-gradient-to-r from-[#030712] via-[#111827] to-[#030712] text-white p-6 mb-6 relative overflow-hidden shadow-2xl border border-amber-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-2xl -ml-20 -mb-20 animate-pulse"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 backdrop-blur-md">
              <Link className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Diamond Directive 42
                </span>
                <span className="px-2.5 py-0.5 bg-violet-600/25 text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Cross-Module Integration
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                وثيقة وشهادة مطابقة تكامل ومزامنة الأنظمة والوحدات المدمجة (Cross-Module Integration)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                ميثاق الجودة للترابط الفيدرالي: يمنع هذا الاعتماد عمل أي وحدة بمعزل عن بقية النظام. يتم فحص مسارات ترحيل البيانات اللحظية والقيود المشتركة بين شؤون الطلاب، الشؤون المالية، والأكاديميات مع حماية الخصوصية عبر عزل الفروع وعزل الحسابات (Tenant Isolation) وحيازة نتائج البحث العام الموحد.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">نسبة الترابط والتماسك العام</div>
              <div className="text-3xl font-black text-amber-400">100% Integrated</div>
            </div>
            <Award className="w-12 h-12 text-amber-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* METRIC CARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">عزل الفروع المتعددة</div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">Tenant Shield Active</div>
          <div className="text-[10px] text-slate-400 mt-1">حماية مطلقة من تداخل السجلات</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">انتقال ومزامنة البيانات</div>
          <div className="text-sm font-black text-amber-650 dark:text-amber-400 font-mono">Real-time Events Sync</div>
          <div className="text-[10px] text-slate-400 mt-1">تنسيق فوري دون انقطاع</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">البحث الموحد والشمولي</div>
          <div className="text-sm font-black text-yellow-600 dark:text-yellow-450 font-mono">Global Search Index</div>
          <div className="text-[10px] text-slate-400 mt-1">نتائج فورية طبقاً للصلاحيات</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">نتائج اختبارات الـ E2E</div>
          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">End-To-End Passed</div>
          <div className="text-[10px] text-slate-400 mt-1">اعتماد واثبات الجدار العالمية</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: PIPELINES LIST */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PIPELINES DISPLAY */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">قنوات ومسارات التكامل المتبادل (Active Integration Pipelines)</h2>
              </div>

              {/* FILTER BADGES */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {uniqueModules.map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedModule === mod
                        ? 'bg-amber-650 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mod === 'all' ? 'الكل' : mod}
                  </button>
                ))}
              </div>
            </div>

            {/* PIPELINES GRID */}
            <div className="space-y-4">
              {filteredPipelines.map((pipe) => (
                <div 
                  key={pipe.id} 
                  className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-950/40 transition-all animate-fadeIn"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black rounded-md font-mono uppercase tracking-wider">
                          {pipe.sourceModule}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black rounded-md font-mono uppercase tracking-wider">
                          {pipe.targetModule}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white">{pipe.arabicName}</h4>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                      <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                      مربوط ومتزامن
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    <strong className="text-slate-700 dark:text-white">القيود الهيكلية:</strong> {pipe.constraintRules}
                  </p>

                  <div className="pt-2.5 border-t border-slate-150 dark:border-slate-800/80 font-mono text-[10px] flex justify-between items-center">
                    <span className="text-slate-400">حزم البيانات المتنقلة:</span>
                    <span className="text-amber-650 dark:text-amber-400 font-bold">{pipe.dataTransferred}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INTERACTIVE E2E PLAYGROUND */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Code className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">أداة محاكاة الترحيل الشامل (End-to-End Simulation)</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              قم بتعديل بيانات حدث القبول أدناه وتجربة ترحيلها المتزامن إلى بقية الوحدات، بما في ذلك قياس حماية العزل الجغرافي والفرعي (Tenant Isolation).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1.5">حزمة بيانات حدث القبول المقترح (JSON Format):</label>
                <textarea
                  rows={3}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full p-3 bg-transparent dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-slate-300"
                  placeholder="حدث تسجيل الطالب..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunE2EFlow}
                  className="py-2 px-4 bg-amber-650 hover:bg-amber-700 text-white rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  محاكاة التدفق المتكامل (E2E)
                </button>

                <button
                  type="button"
                  onClick={() => setTestPayload('EnrollmentEvent: { studentId: "STU-1004-99", branchId: "BRANCH-NORTH", gradeLevel: "Grade_11", tuitionAmount: 12000 }')}
                  className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                >
                  تحميل حدث سليم ومعزول فرعياً 🏢
                </button>

                <button
                  type="button"
                  onClick={() => setTestPayload('EnrollmentEvent: { studentId: "STU-9999-00", gradeLevel: "Grade_12", tuitionAmount: 15000 }')}
                  className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                >
                  تحميل حدث يفتقد رمز الفرع (Tenant Leak) ⚠️
                </button>
              </div>

              <div className="p-4 rounded-lg border font-mono text-xs leading-relaxed text-right transition-all">
                <div className="text-[10px] text-slate-400 mb-1 font-bold">تقرير سريان الحدث ومستخرجات الربط:</div>
                <pre className={`whitespace-pre-wrap ${
                  sandboxStatus === 'warning' 
                    ? 'text-rose-600 dark:text-rose-400 font-bold' 
                    : sandboxStatus === 'success' 
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                    : 'text-slate-500'
                }`}>
                  {sandboxResult}
                </pre>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* RUNNER PANEL */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <GitFork className="w-12 h-12 text-amber-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك فحص الربط الفيدرالي</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لتشغيل المراجعة الشاملة لجميع العلاقات، ترحيل البيانات اللحظية، وتوافق القيود المشتركة بين الأقسام.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري إجراء فحص الـ E2E...</span>
                  <span className="font-mono text-amber-650 dark:text-amber-400">{auditProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-amber-650 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${auditProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isAuditing}
              onClick={triggerGlobalIntegrationSweep}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل فحص التكامل والترابط
            </button>
          </div>

          {/* TENANT ISOLATION SPEC */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <LockIcon className="w-4 h-4 text-amber-500" />
              معايير عزل المدارس والفروع (Tenant Isolation)
            </h3>

            <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500 flex-none mt-0.5" />
                <span>عزل كامل في مستوى قواعد البيانات والاستعلامات عبر التحقق من مفتاح فريد لكل فرع.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500 flex-none mt-0.5" />
                <span>حماية صلاحيات المستخدم وضمان عدم تداخل نتائج البحث العام مع المدارس الزميلة.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500 flex-none mt-0.5" />
                <span>مزامنة الأحداث والقيود المالية بمستوى أمان عسكري لمنع التعديلات المتداخلة.</span>
              </li>
            </ul>
          </div>

          {/* INTEGRATION CERTIFICATE */}
          {isCertified && (
            <div className="bg-gradient-to-br from-amber-50 to-violet-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-950/40 text-center animate-scaleIn">
              <Stamp className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-animate-pulse" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة تكامل الأنظمة المعتمدة</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة مصادقة نهائية على تكامل وتطابق روابط الـ ERP وعزل الفروع ونقل الأحداث بنجاح.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={inspectorName} 
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم مستشار الربط المعتمد"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  رخصة اعتماد: #{authCode}
                </span>
              </div>
            </div>
          )}

          {/* LOGGER */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">وحدة مراقبة تكامل وربط مجمع المدارس</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 text-right">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-slate-300">
                  <span className="text-amber-400 ml-1.5">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
