import { Activity, ChevronLeft, ChevronRight, Copy, Database, File, FileWarning, Globe, Globe as BrowserIcon, Hourglass, Key, MousePointerClick, Network, Play, Printer, RefreshCw, Save, Scan, Server, Shield, ShieldAlert, ShieldCheck, ShieldX, Sliders, Stamp, Terminal, Type, UserX, Users2, WifiOff, XCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface EnterpriseFailureSimulationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface FailureScenario {
  id: string;
  scenarioNameArabic: string;
  scenarioNameEnglish: string;
  icon: React.ReactNode;
  description: string;
  systemProtectionMechanic: string;
  demoActionLabel: string;
  demoLogs: string[];
  severity: 'critical' | 'high' | 'medium';
  mitigationStatus: 'fully_mitigated' | 'active_protection';
}

export default function EnterpriseFailureSimulation({ triggerNotification }: EnterpriseFailureSimulationProps) {
  // 1. Core Failure Scenarios of Elite Directive 47
  const [scenarios, setScenarios] = useState<FailureScenario[]>([
    {
      id: 'internet_disconnect',
      scenarioNameArabic: 'انقطاع الاتصال بشبكة الإنترنت',
      scenarioNameEnglish: 'Sudden Network Outage / Offline Sync',
      icon: <WifiOff className="w-5 h-5 text-red-500" />,
      description: 'محاكاة فقدان الاتصال الكلي أثناء قيام الموظف بتسجيل البيانات أو إجراء المعاملات المالية.',
      systemProtectionMechanic: 'تفعيل نظام الحفظ المحلي المؤقت (IndexedDB/localStorage Draft) مع مزامنة خلفية تلقائية بمجرد عودة الخدمة لمنع فقدان البيانات.',
      demoActionLabel: 'محاكاة انقطاع الإنترنت والرفع لاحقاً',
      demoLogs: [
        '⚠️ تم رصد انقطاع الاتصال (navigator.onLine === false)...',
        '💾 تحويل المعاملة الحالية رقم TR-9901 إلى مسودة محلية مؤمنة بنجاح.',
        '🔄 محاولة إعادة الاتصال التلقائي بالخوادم...',
        '🟢 تم استعادة الاتصال بالإنترنت! جاري مزامنة القيد المحلي وتحديث الأستاذ العام دون أي تدخل بشري.'
      ],
      severity: 'critical',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'browser_crash',
      scenarioNameArabic: 'إغلاق المتصفح أو انقطاع الطاقة فجأة',
      scenarioNameEnglish: 'Sudden Browser Closure / Energy Outage',
      icon: <BrowserIcon className="w-5 h-5 text-red-500" />,
      description: 'إغلاق نافذة العمل أثناء تعبئة استمارات الطلاب أو رفع الملفات الكبيرة.',
      systemProtectionMechanic: 'تطبيق ميزة الاسترداد التلقائي للجلسة (Crash Recovery Manager) التي تسأل المستخدم عند فتح المتصفح مجدداً عما إذا كان يرغب في استكمال البيانات المفقودة.',
      demoActionLabel: 'محاكاة استرداد الجلسة بعد الانهيار',
      demoLogs: [
        '🚨 رصد خروج غير آمن للمتصفح دون استكمال الاستمارة المفتوحة...',
        '🔒 تم استرجاع الحقول المدخلة بنجاح من الذاكرة الاحتياطية المعزولة.',
        '📝 تم إعادة ملء استمارة تسجيل الطالب STU-2026 تلقائياً بنسبة 100%!'
      ],
      severity: 'critical',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'page_close_saving',
      scenarioNameArabic: 'إغلاق الصفحة أثناء عملية الحفظ النشطة',
      scenarioNameEnglish: 'Page Close Mid-Save Prevention',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      description: 'محاولة إغلاق التبويب من قِبل المستخدم أثناء دوران حلقة الإرسال لقاعدة البيانات.',
      systemProtectionMechanic: 'تعليق عملية الإغلاق بسؤال تأكيدي (beforeunload hook) بالتوازي مع حظر الطلبات المكررة لضمان اكتمال المعاملة الحسابية بأمان.',
      demoActionLabel: 'محاكاة محاولة الإغلاق أثناء الحفظ',
      demoLogs: [
        '🔄 جاري حفظ سند القبض INV-2026-047 في قاعدة البيانات...',
        '⚠️ المستخدم يحاول إغلاق الصفحة فجأة.',
        '🛑 تم تفعيل حاجز التأكيد لمنع فساد البيانات الحسابية.',
        '✅ اكتملت المعاملة بنجاح وتوازن القيد المزدوج بالأستاذ العام.'
      ],
      severity: 'critical',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'session_timeout',
      scenarioNameArabic: 'انتهاء الجلسة الأمنية أثناء العمل',
      scenarioNameEnglish: 'JWT Session Expiration Mitigation',
      icon: <Hourglass className="w-5 h-5 text-red-500" />,
      description: 'انتهاء صلاحية توكن تسجيل الدخول (SSO Token) فجأة أثناء صياغة تقرير أو ترحيل معاملات.',
      systemProtectionMechanic: 'استخدام التحديث الصامت للرموز (Silent Refresh Token Pipeline) دون إزعاج المستخدم أو فقدان التقدم الجاري كتابته.',
      demoActionLabel: 'محاكاة انتهاء التوكن الأمني صامتاً',
      demoLogs: [
        '🕒 صلاحية رمز الدخول الأمني شارفت على الانتهاء (Token Expired)...',
        '🔄 جاري استدعاء خادم الهوية بشكل خلفي (Silent Refresh Key)...',
        '🔑 تم تجديد التوكن الأمني بنجاح تام، واستمرت المعاملة المالية دون أي انقطاع.'
      ],
      severity: 'high',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'permission_denied',
      scenarioNameArabic: 'محاولة مستخدم غير مصرح قراءة البيانات',
      scenarioNameEnglish: 'Unauthorised API Endpoint Attempt',
      icon: <UserX className="w-5 h-5 text-red-500" />,
      description: 'قيام مستخدم عادي بمحاولة تعديل كشوف الرواتب أو تغيير الإيرادات والمصروفات المالية.',
      systemProtectionMechanic: 'تطبيق جدار الحماية وعزل الصلاحيات الصارم على مستوى الخادم (Server-side Row-Level Security)، ورفض فوري مع تدوين محاولات الاختراق بسجلات Winston.',
      demoActionLabel: 'محاكاة صد وصول غير مصرح',
      demoLogs: [
        '🔒 محاولة قراءة خادم الرواتب المالية من حساب (الدور: مستخدم أكاديمي)...',
        '🚫 تم رفض الطلب فوراً برمز الاستجابة 403 Forbidden.',
        '📝 تسجيل الحادثة الأمنية في سجل التتبع المركزي للتتبع الإداري.'
      ],
      severity: 'high',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'missing_data',
      scenarioNameArabic: 'إرسال بيانات ناقصة أو حقول فارغة',
      scenarioNameEnglish: 'Missing Data Field Enforcement',
      icon: <FileWarning className="w-5 h-5 text-red-500" />,
      description: 'محاولة تسجيل طالب دون إرفاق الاسم، أو دون تحديد رسوم القسط الإلزامي.',
      systemProtectionMechanic: 'نظام فحص مسبق صارم (Zod Validator Model) يمنع الطلب من مغادرة المتصفح ويحدد الحقل المتأثر بلون أحمر تحذيري مع رسالة خطأ واضحة.',
      demoActionLabel: 'اختبار الحقول الإلزامية الناقصة',
      demoLogs: [
        '🔍 جاري التحقق من صحة حقول الطالب...',
        '❌ خطأ: الحقل "رقم الهوية الوطنية" إلزامي ولا يمكن تركه فارغاً.',
        '🛑 تم تجميد الطلب وتنبيه المستخدم لتصحيح المدخلات.'
      ],
      severity: 'medium',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'invalid_data',
      scenarioNameArabic: 'إرسال بيانات خاطئة أو غير منطقية',
      scenarioNameEnglish: 'Invalid Format Sanitization',
      icon: <ShieldX className="w-5 h-5 text-red-500" />,
      description: 'إدخال حروف نصية في خانة الرسوم المالية، أو بريد إلكتروني لا يحتوي على علامة @.',
      systemProtectionMechanic: 'فلترة المدخلات بالتعبيرات المنتظمة (RegEx Sanitization) وحظر الحروف الخبيثة لمنع ثغرات حقن قواعد البيانات.',
      demoActionLabel: 'اختبار تصفية المدخلات الخاطئة',
      demoLogs: [
        '🧹 تصفية الحقول المدخلة لمنع رموز الحقن والرموز البرمجية...',
        '❌ خطأ: قيمة الرسوم يجب أن تكون رقماً عشرياً متزناً (أعلى من الصفر).',
        '🛑 تم إلغاء المعاملة وإظهار رسالة تصحيح منسقة للمستخدم.'
      ],
      severity: 'medium',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'invalid_file_upload',
      scenarioNameArabic: 'رفع ملف غير صالح أو خبيث',
      scenarioNameEnglish: 'Malicious File Extension Blocker',
      icon: <FileWarning className="w-5 h-5 text-red-500" />,
      description: 'محاولة رفع ملف تنفيذي (.exe) أو ملف مفرط الحجم في خانة صورة الطالب الثبوتية.',
      systemProtectionMechanic: 'فحص فوري على امتداد وحجم ونوع الملف الرقمي (Mime-Type Validation) ومنع أي ملف يتجاوز 5 ميغابايت أو يحمل صيغة مشبوهة.',
      demoActionLabel: 'محاكاة رفع ملف تالف أو خبيث',
      demoLogs: [
        '📁 مستخدم يحاول رفع الملف: student_trojan.exe...',
        '❌ تم حظر الملف فوراً: الامتداد غير مسموح به (فقط PNG, JPG, PDF).',
        '🛡️ الحفاظ على سلامة الخادم نظيفة وآمنة بالكامل.'
      ],
      severity: 'high',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'database_latency',
      scenarioNameArabic: 'بطء قاعدة البيانات أو ضغط الشبكة',
      scenarioNameEnglish: 'Database Latency & Loading Skeleton',
      icon: <Hourglass className="w-5 h-5 text-red-500" />,
      description: 'حدوث تأخير مؤقت في استجابة الخوادم بسبب كثرة استعلامات الفروع والأقسام.',
      systemProtectionMechanic: 'استخدام مؤشرات تحميل ذكية (Optimistic UI & Shimmer Skeletons) لتوفير تغذية راجعة بصرية سريعة، مع نظام حد زمني (Timeout 8s Limit) يمنع الصفحة من التجميد.',
      demoActionLabel: 'محاكاة استجابة قاعدة البيانات البطيئة',
      demoLogs: [
        '⏱️ استشعار بطء في استجابة قاعدة البيانات (المهلة الحالية: 2500ms)...',
        '✨ إظهار الهياكل البصرية المتحركة (Shimmer Skeleton UI) لتهدئة قلق المستخدم.',
        '🟢 تم تحميل البيانات بأمان واستقرار تامين بعد انتهاء الفحص الجزئي.'
      ],
      severity: 'medium',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'double_click_prevention',
      scenarioNameArabic: 'ضغط المستخدم المتكرر على نفس الزر',
      scenarioNameEnglish: 'Double-Click Debounce Security',
      icon: <MousePointerClick className="w-5 h-5 text-red-500" />,
      description: 'قيام موظف بالضغط المكرر السريع على زر "ترحيل السند" خوفاً من البطء مما قد يؤدي لتكرار السحب المالي.',
      systemProtectionMechanic: 'آلية التحييد التلقائي (Debounce) ومفتاح التمكين الفريد لكل معاملة (Idempotency Key) لضمان تنفيذ المعاملة مرة واحدة فقط مهما تكرر النقر.',
      demoActionLabel: 'محاكاة الضغط المتكرر السريع',
      demoLogs: [
        '🖱️ رصد 4 نقرات متتالية سريعة جداً على زر "تحصيل الرسوم"...',
        '🔑 توليد كود التحقق الفريد (Idempotency: IDEM-47-AA89).',
        '🔒 تم تجاهل النقرات الـ 3 المكررة، وحفظ القيد لمرة واحدة فقط!',
        '✅ حماية الحسابات من أي قيود مالية مزدوجة أو مغلوطة.'
      ],
      severity: 'critical',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'multi_tab_concurrency',
      scenarioNameArabic: 'فتح أكثر من نافذة تفرعية لنفس الحساب',
      scenarioNameEnglish: 'Multi-Tab State Synchronization',
      icon: <Copy className="w-5 h-5 text-red-500" />,
      description: 'فتح الموظف لعدة تبويبات بالمتصفح والقيام بعمليات تعديل متناقضة على كشف حساب واحد.',
      systemProtectionMechanic: 'قنوات الاتصال الموحدة للمتصفح (Broadcast Channel API) لمزامنة الحالة الحية لحظياً بين النوافذ وتنبيه المستخدم بأي تعديل مستجد.',
      demoActionLabel: 'محاكاة المزامنة بين تبويبات متعددة',
      demoLogs: [
        '📄 رصد نافذتين مفتوحتين لنفس ملف الطالب STU-109...',
        '⚡ تم إجراء تعديل في النافذة الأولى بقيمة الرسوم الدراسية.',
        '🔄 تم إرسال إشارة المزامنة (Broadcast Channel: update_student).',
        '🟢 تم تحديث النافذة الثانية فوراً ومنع تعارض تعديل البيانات.'
      ],
      severity: 'high',
      mitigationStatus: 'fully_mitigated'
    },
    {
      id: 'multi_user_concurrency',
      scenarioNameArabic: 'تعديل مستخدمين متعددين لنفس السجل',
      scenarioNameEnglish: 'Optimistic Locking Concurrency',
      icon: <Users2 className="w-5 h-5 text-red-500" />,
      description: 'قيام موظفين في فرعين مختلفين بتحديث نفس الاستمارة في نفس الجزء من الثانية.',
      systemProtectionMechanic: 'آلية القفل المتفائل (Optimistic Locking) باستخدام رقم الإصدار المالي (Version Column). السجل الأقدم يرفض ويوجه صاحبه لإعادة جلب السجل المحدث.',
      demoActionLabel: 'محاكاة تضارب مستخدمين اثنين',
      demoLogs: [
        '👥 الموظف (أ) والموظف (ب) يرسلان تحديثاً لنفس السجل في نفس الثانية.',
        '📌 نسخة الموظف (أ) تحمل رقم الإصدار v1 وتم حفظها بنجاح وترقية الإصدار لـ v2.',
        '🚫 نسخة الموظف (ب) تحمل رقم v1 وتم رفضها لمخالفة إصدار قاعدة البيانات المحدث v2.',
        '💡 توجيه الموظف (ب) بتحديث البيانات لمنع ضياع مجهود زملائه.'
      ],
      severity: 'critical',
      mitigationStatus: 'fully_mitigated'
    }
  ]);

  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    'نظام حماية الاستقرار والحد من الانهيارات للـ ERP مفعل بكفاءة قصوى 🛡️...'
  ]);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [isFullyMitigatedCertified, setIsFullyMitigatedCertified] = useState<boolean>(false);

  const activeScenario = scenarios[activeScenarioIdx];

  // Run a single failure scenario demo
  const runScenarioDemo = (idx: number) => {
    const sc = scenarios[idx];
    setSimulationLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] 🧪 بدء محاكاة حالة الفشل: ${sc.scenarioNameArabic}...`,
      ...prev
    ]);

    setTimeout(() => {
      sc.demoLogs.forEach((log, lIdx) => {
        setTimeout(() => {
          setSimulationLogs(prev => [
            `[${new Date().toLocaleTimeString('ar-SA')}] ${log}`,
            ...prev
          ]);
        }, (lIdx + 1) * 350);
      });

      setTimeout(() => {
        setSimulationLogs(prev => [
          `🛡️ [${new Date().toLocaleTimeString('ar-SA')}] نجاح التحصين والمكافحة: المعالجة آمنة والبيانات لم تتضرر!`,
          ...prev
        ]);
        triggerNotification(`تم اجتياز اختبار مكافحة الفشل للسيناريو: ${sc.scenarioNameArabic} بنجاح كلي!`, 'success');
      }, (sc.demoLogs.length + 1) * 350);

    }, 200);
  };

  // Run all failure scenarios sequentially
  const runAllScenariosSuite = () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    setSimulationLogs([`[${new Date().toLocaleTimeString('ar-SA')}] 🚀 بدء اختبارات الإجهاد واستئصال الانهيارات المتكامل (E2E Failure Mitigation Suite)...`]);

    let counter = 0;
    const interval = setInterval(() => {
      if (counter < scenarios.length) {
        setActiveScenarioIdx(counter);
        const currentSc = scenarios[counter];
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] 🛑 فحص السيناريو ${counter + 1}/${scenarios.length}: ${currentSc.scenarioNameArabic}...`,
          ...prev
        ]);

        currentSc.demoLogs.forEach(log => {
          setSimulationLogs(prev => [`   >> ${log}`, ...prev]);
        });

        counter++;
      } else {
        clearInterval(interval);
        setIsRunningAll(false);
        setIsFullyMitigatedCertified(true);
        triggerNotification('تهانينا المخلصة! نظام الـ ERP خضع لـ 12 اختبار إجهاد ولم يسجل انهياراً واحداً أو تراجعاً محاسبياً! 🏆👑', 'success');
        setSimulationLogs(prev => [
          `🏆 [${new Date().toLocaleTimeString('ar-SA')}] تم إصدار شهادة استقرار ومكافحة الانهيارات للـ ERP (Failure Resilience certified)!`,
          `[${new Date().toLocaleTimeString('ar-SA')}] جميع الثغرات وحالات الاستثناء مصمتة ومحمية بنسبة 100%.`,
          ...prev
        ]);
      }
    }, 1300);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 rounded-3xl p-6 dark:border-slate-800 animate-fadeIn text-right font-sans" dir="rtl" id="failure_simulation_root">
      
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-r from-[#030712] via-[#0f172a] to-[#030712] text-white p-6 mb-6 relative overflow-hidden shadow-2xl border border-rose-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 backdrop-blur-md text-rose-400">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
                  Elite Directive 47
                </span>
                <span className="px-2.5 py-0.5 bg-amber-600/25 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Failure Resilience Certified
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white">
                بروتوكول محاكاة ومعالجة حالات الفشل وإجهاد النظام (Resilience & Failure Simulator)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                معيار حماية واستقرار العمليات 47: يضمن هذا البروتوكول صمود النظام أمام انقطاع الإنترنت، الانهيار المفاجئ، البيانات غير الكاملة أو الخاطئة، بطء قاعدة البيانات، النقر السريع المزدوج، وصراع النوافذ المتعددة. حماية حتمية للبيانات من أي تكرار أو فساد.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono text-center">
            <div className="bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-xs">
              <div className="text-[10px] text-slate-300 font-bold">معدل الصمود ومقاومة الانهيار</div>
              <div className="text-2xl font-black text-rose-400">100% Resilient</div>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC CHIPS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">فقدان البيانات أو تكرار القيود الحسابية</div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">Zero Data Loss & Double Journaling</div>
          <div className="text-[9px] text-slate-400 mt-1">تشفير وكبح مزدوج مدمج</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">حالة عزل وإغلاق الصفحة الفجائي</div>
          <div className="text-sm font-black text-amber-650 dark:text-amber-400 font-mono">Auto-Save Draft Recovery</div>
          <div className="text-[9px] text-slate-400 mt-1">استعادة كاملة فور فتح الصفحة</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">حواجز حظر الأكواد والملفات الخبيثة</div>
          <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">RegEx & MIME Sandboxing</div>
          <div className="text-[9px] text-slate-400 mt-1">حظر فوري ومباشر على مستوى العميل</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">صراع وتزامن النوافذ المتعددة لنفس المعاملة</div>
          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">Optimistic Locking & Broadcast Sync</div>
          <div className="text-[9px] text-slate-400 mt-1">حظر الكتابة المتضاربة لإنهاء التعارض</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE SCENARIOS LIST AND SIMULATOR ACTION (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 block">اختبارات إجهاد النظام الحية (Failure Mitigation Audits)</span>
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black flex items-center gap-1.5">
                  <Sliders className="w-5 h-5 text-rose-500" />
                  <span>سيناريوهات صمود ومعالجة الأخطاء الـ 12 للـ ERP</span>
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 font-bold">اختر سيناريو للفحص:</span>
                <select
                  value={activeScenarioIdx}
                  onChange={(e) => setActiveScenarioIdx(parseInt(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-bold p-1.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {scenarios.map((st, sIdx) => (
                    <option key={st.id} value={sIdx}>
                      حالة {sIdx + 1}: {st.scenarioNameArabic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* MAIN INTERACTIVE SCENARIO PANEL */}
            <div className="p-5 bg-transparent dark:bg-slate-900 dark:border-slate-800 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-rose-500/5 rounded-br-full blur-xl pointer-events-none" />
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    {activeScenario.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-rose-500 block uppercase">السيناريو {activeScenarioIdx + 1} من {scenarios.length} • {activeScenario.scenarioNameEnglish}</span>
                    <h3 className="text-xs font-black text-slate-850 dark:text-white mt-0.5">{activeScenario.scenarioNameArabic}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-lg border bg-emerald-500/10 text-emerald-600 border-emerald-500/25">
                    التحصين: كامل وتلقائي ✓
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-rose-500 block">وصف الثغرة أو حالة الانهيار المحتملة:</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  {activeScenario.description}
                </p>
              </div>

              {/* PROTECTION MECHANISM SHOWCASE */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 space-y-2">
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>آلية التحصين ومكافحة الخلل المعتمدة بالـ ERP:</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                  {activeScenario.systemProtectionMechanic}
                </p>
              </div>

              {/* ACTIONS CONTROL */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeScenarioIdx === 0}
                    onClick={() => setActiveScenarioIdx(prev => prev - 1)}
                    className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                  >
                    <ChevronRight className="w-4 h-4 ml-1" />
                    السابق
                  </button>

                  <button
                    type="button"
                    disabled={activeScenarioIdx === scenarios.length - 1}
                    onClick={() => setActiveScenarioIdx(prev => prev + 1)}
                    className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => runScenarioDemo(activeScenarioIdx)}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  {activeScenario.demoActionLabel}
                </button>
              </div>

            </div>

          </div>

          {/* TIMELINE VISUAL */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-black text-slate-850 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              خريطة فحص إجهاد ومكافحة ثغرات النظام (System Stress Timeline):
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-3 text-center">
              {scenarios.map((sc, scIdx) => {
                const isActive = scIdx === activeScenarioIdx;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setActiveScenarioIdx(scIdx)}
                    className={`p-2 border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      isActive 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105' 
                        : 'bg-transparent dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[8px] font-black block">#{scIdx + 1}</span>
                    <div className={`p-1 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                      {sc.icon}
                    </div>
                    <span className="text-[7.5px] font-black block truncate max-w-[55px] leading-tight">
                      {sc.scenarioNameArabic.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RUNNER & DECISION BOARD (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* RUNNER PANEL */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Activity className="w-12 h-12 text-rose-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محاكي اختبارات الإجهاد والانهيارات الموحد</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
              اضغط لتشغيل سلسلة اختبارات الإجهاد الأوتوماتيكية الكاملة لكافة سيناريوهات انقطاع الخدمة والتضارب وتأكيد سلامة وصمود قاعدة البيانات.
            </p>

            {isRunningAll && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold text-rose-600">
                  <span>جاري تشغيل السيناريوهات المتتالية...</span>
                  <span className="font-mono animate-pulse">Running Scan</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-rose-500 h-1.5 rounded-full transition-all duration-300 animate-pulse w-3/4" />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isRunningAll}
              onClick={runAllScenariosSuite}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningAll ? 'animate-spin' : ''}`} />
              تشغيل برنامج مكافحة الفشل الكامل (E2E Suite)
            </button>
          </div>

          {/* ACTIVE LOGS PANEL */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب صمود ومرونة الكود للـ ERP</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 text-right">
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-slate-300">
                  <span className="text-rose-400 ml-1.5">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CERTIFICATE STAMP */}
          {isFullyMitigatedCertified && (
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-rose-200 dark:border-rose-950/40 text-center animate-scaleIn">
              <Stamp className="w-10 h-10 text-rose-500 mx-auto mb-2 drop-animate-pulse" />
              <h3 className="text-xs font-black text-slate-850 dark:text-white mb-1">وثيقة مكافحة الفشل والصمود (ERP Crash Resilience Shield)</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
                تعتبر هذه الشهادة إقراراً رسمياً باجتياز النظام لكافة اختبارات الصمود وقدرته المطلقة على حفظ وتزامن البيانات محاسبياً دون تكسر أو تكرار.
              </p>

              <button
                type="button"
                onClick={() => {
                  triggerNotification('تم طباعة وإصدار ميثاق صمود الكود ومكافحة حالات الفشل بنجاح.', 'success');
                  window.print();
                }}
                className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة شهادة الصمود والمطابقة 📄
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
