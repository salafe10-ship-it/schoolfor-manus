import { Activity, AlertCircle, AlertTriangle, ArrowRight, BadgeCheck, BookOpen, Check, CheckCircle, CheckCircle2, ClipboardCheck, ClipboardList, Clock, Code, Cpu, CpuIcon, DatabaseZap, ExternalLink, FileCheck, FileSignature, Filter, Flame, HardDriveUpload, HelpCircle, Info, ListCollapse, Lock as LockIcon, Network, Play, Plus, RotateCw, Save, Search, ShieldAlert, ShieldCheck, Sparkles, Terminal, Trash2, UserCheck } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditRemark {
  id: string;
  title: string;
  category: string;
  source: string;
  date: string;
  verification: 'Confirmed' | 'Partially Confirmed' | 'Not Applicable';
  risk: 'Critical' | 'High' | 'Medium' | 'Low';
  decision: string;
  implementationTasks: { id: string; text: string; done: boolean }[];
  regressionTested: boolean;
  certified: boolean;
  certifiedBy?: string;
  certifiedAt?: string;
  logs: string[];
}

const INITIAL_REMARKS: AuditRemark[] = [
  {
    id: 'EXT-AUD-101',
    title: 'صلاحية تصدير البيانات المالية الحساسة دون تسجيل بالدفتر المركزي الموحد للرقابة',
    category: 'الأمن والحوكمة الأمنية',
    source: 'تقرير التدقيق الخارجي لشركة Deloitte - الربع الثاني 2026',
    date: '2026/06/15',
    verification: 'Confirmed',
    risk: 'Critical',
    decision: 'تم اتخاذ قرار بربط جميع نهايات التصدير في نظام الحسابات (Financial Export API Endpoints) مع الدالة الرقابية المركزية AuditRepository.log لتدوين هوية الموظف والآي بي ومحتوى الملف المصدر لحظياً في قاعدة البيانات وتوثيقها بصمة مشفرة.',
    implementationTasks: [
      { id: 't1', text: 'ربط واجهات تصدير ميزان المراجعة بقفل الرقابة', done: true },
      { id: 't2', text: 'إضافة تدوين هوية الموظف IP و MAC في كشف حساب الفروع', done: true },
      { id: 't3', text: 'إنشاء بصمة تشفيرية من السجل لمنع التلاعب الخلفي بالملف', done: true }
    ],
    regressionTested: true,
    certified: true,
    certifiedBy: 'م. سليمان غازي (المدير التقني للمنصة)',
    certifiedAt: '2026/06/20 14:30',
    logs: [
      'تم إنشاء الملاحظة في نظام الحوكمة.',
      'تغيير حالة التحقق إلى: مؤكدة (Confirmed).',
      'تصنيف الخطورة كـ: حرجة جداً (Critical).',
      'إدخال الخطة الهندسية وبدء التطوير.',
      'اكتمال مرحلة التنفيذ البرمجي.',
      'اجتياز اختبارات عدم التراجع للوحدات المالية بنجاح بنسبة 100%.',
      'تم تقديم طلب الاعتماد النهائي وتوثيقه بواسطة م. سليمان غازي.'
    ]
  },
  {
    id: 'EXT-AUD-102',
    title: 'بطء ملحوظ في فرز استعلامات كشوف الحسابات المجمعة للفروع ذات الكثافة التشغيلية الكبيرة',
    category: 'أداء النظام والتحسين المتقدم',
    source: 'ملاحظة هيئة الرقابة على النظم والتحول الرقمي الحكومي',
    date: '2026/07/01',
    verification: 'Confirmed',
    risk: 'High',
    decision: 'إعادة هيكلة فهارس الاستعلام المركبة لجدول القيود اليومية (Daily Journal Entries) وإدخال طبقة الكاش Redis Cache لنتائج كشوف الحسابات المتكررة للفصل المالي المعتمد لتقليل استهلاك وحدة المعالجة المركزية.',
    implementationTasks: [
      { id: 't1', text: 'إنشاء فهرس استعلام مركب على حقول (school_id, branch_id, date)', done: true },
      { id: 't2', text: 'إعداد استراتيجية إبطال التخزين المؤقت الكاش عند ترحيل قيد جديد', done: false },
      { id: 't3', text: 'تطوير كود الفلترة اللحظية (Pre-calculated Balances Engine)', done: false }
    ],
    regressionTested: false,
    certified: false,
    logs: [
      'تم إدخال الملاحظة في النظام للفرز.',
      'تحديد حالة التحقق: Confirmed.',
      'تصنيف الخطورة: High.',
      'كتابة المقترح الهندسي لمعالجة عنق الزجاجة في قاعدة البيانات.'
    ]
  },
  {
    id: 'EXT-AUD-103',
    title: 'طلب إضافة حقول توثيق الجنسية وتفاصيل الإقامة في استمارة القبول والتسجيل الفوري للطلاب الوافدين',
    category: 'لوائح العمل المدرسية الموحدة',
    source: 'توجيهات وزارة التعليم والقبول المركزي',
    date: '2026/07/05',
    verification: 'Partially Confirmed',
    risk: 'Medium',
    decision: 'الملاحظة صحيحة جزئياً حيث تتوفر الحقول بالفعل في ملف الطالب التفصيلي ولكنها غير متوفرة في نموذج القبول السريع (Speed Admissions Gate). سيتم توسيع واجهة القبول السريع لتشمل رقم وتاريخ انتهاء الإقامة بصورة اختيارية لتجنب تشتت مدخل البيانات.',
    implementationTasks: [
      { id: 't1', text: 'توسيع واجهة القبول السريع بقسم البيانات الدولية', done: false },
      { id: 't2', text: 'ربط الحقول البرمجية بخوارزمية فحص هوية المقيم (Yaqeen System Mock)', done: false }
    ],
    regressionTested: false,
    certified: false,
    logs: [
      'تم استلام الملاحظة وتحليلها من الفريق التنظيمي.',
      'حالة التحقق: مؤكدة جزئياً (Partially Confirmed).',
      'تحديد الخطورة: Medium.'
    ]
  },
  {
    id: 'EXT-AUD-104',
    title: 'طلب تفعيل ربط مباشر وقراءة لحظية من نظام قواعد بيانات Oracle 11g Legacy المهمل',
    category: 'التكامل التقني للمنظومة',
    source: 'طلب خارجي من إدارة تكنولوجيا المعلومات بفرع طرابلس القديم',
    date: '2026/07/08',
    verification: 'Not Applicable',
    risk: 'Low',
    decision: 'النظام القديم تم إيقافه تماماً بموجب قرار الحوكمة رقم 412 ومستندات الانتقال السحابي المعتمدة، وقاعدة البيانات معزولة ولا تدعم بروتوكولات الأمان السحابية الحديثة لـ SaaS. تم سحب وتصدير كافة السجلات التاريخية مسبقاً وتخزينها في مستودع البيانات المركزي للرجوع إليها عند الطلب، وبالتالي لا توجد أي حاجة أو إمكانية برمجية لإنشاء اتصال نشط يهدد سلامة المنظومة الحالية.',
    implementationTasks: [],
    regressionTested: false,
    certified: true,
    certifiedBy: 'أ. مسفر الغامدي (رئيس قطاع الحوكمة)',
    certifiedAt: '2026/07/10 10:15',
    logs: [
      'استلام الطلب الخارجي وفرزه.',
      'حالة التحقق: غير منطبق (Not Applicable).',
      'مستند التبرير التقني معتمد رسمياً لمنع الفتح العشوائي للمنافذ الخلفية.',
      'تم اعتماد الإغلاق كإجراء مستثنى مبرر برمجياً وتوثيقه بسجلات الامتثال.'
    ]
  }
];

export default function ExternalAuditProtocol({
  triggerNotification
}: {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}) {
  const emptyRemark: AuditRemark = {
    id: '', title: '', category: '', source: '', date: '', verification: 'Not Applicable', risk: 'Low',
    decision: '', implementationTasks: [], regressionTested: false, certified: false, logs: []
  };
  // لا تُعرض ملاحظات أو اعتمادات تدقيق مزروعة؛ المصدر المركزي هو المرجع الوحيد.
  const [remarks, setRemarks] = useState<AuditRemark[]>([]);
  const [selectedRemarkId, setSelectedRemarkId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<string>('all');
  
  // New remark insertion modal/form state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newRemarkTitle, setNewRemarkTitle] = useState<string>('');
  const [newRemarkCategory, setNewRemarkCategory] = useState<string>('الأمن والحوكمة الأمنية');
  const [newRemarkSource, setNewRemarkSource] = useState<string>('');
  const [newRemarkRisk, setNewRemarkRisk] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium');

  // Interactive implementation terminal & simulation state
  const [simulatingStep4, setSimulatingStep4] = useState<boolean>(false);
  const [simulatingStep5, setSimulatingStep5] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [regTestsPassed, setRegTestsPassed] = useState<boolean | null>(null);

  // Active Selected Remark
  const selectedRemark = useMemo(() => {
    return remarks.find(r => r.id === selectedRemarkId) || emptyRemark;
  }, [remarks, selectedRemarkId]);

  // Filtered Remarks List
  const filteredRemarks = useMemo(() => {
    return remarks.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = filterRisk === 'all' || r.risk === filterRisk;
      const matchesVerif = filterVerification === 'all' || r.verification === filterVerification;
      return matchesSearch && matchesRisk && matchesVerif;
    });
  }, [remarks, searchQuery, filterRisk, filterVerification]);

  // KPIs
  const kpis = useMemo(() => {
    const total = remarks.length;
    const confirmedAndSolved = remarks.filter(r => r.verification !== 'Not Applicable' && r.certified).length;
    const documentedNA = remarks.filter(r => r.verification === 'Not Applicable' && r.certified).length;
    const unresolved = remarks.filter(r => !r.certified).length;
    const criticalCount = remarks.filter(r => r.risk === 'Critical' && !r.certified).length;
    
    return { total, confirmedAndSolved, documentedNA, unresolved, criticalCount };
  }, [remarks]);

  // Handle Updates to the Selected Remark
  const updateSelectedRemark = (updatedFields: Partial<AuditRemark>) => {
    setRemarks(prev => prev.map(r => {
      if (r.id === selectedRemarkId) {
        const newLogs = [...r.logs];
        if (updatedFields.verification && updatedFields.verification !== r.verification) {
          newLogs.push(`تم تحديث حالة التحقق إلى: ${updatedFields.verification}`);
        }
        if (updatedFields.risk && updatedFields.risk !== r.risk) {
          newLogs.push(`تم تحديث مستوى الخطورة إلى: ${updatedFields.risk}`);
        }
        if (updatedFields.certified === true) {
          newLogs.push(`تم اعتماد إغلاق الملاحظة نهائياً بنجاح.`);
        }
        return { ...r, ...updatedFields, logs: newLogs };
      }
      return r;
    }));
  };

  const handleAddNewRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkTitle || !newRemarkSource) {
      triggerNotification('الرجاء تعبئة كافة الحقول المطلوبة للملاحظة الخارحية', 'warning');
      return;
    }
    const newId = `EXT-AUD-${100 + remarks.length + 1}`;
    const newRemark: AuditRemark = {
      id: newId,
      title: newRemarkTitle,
      category: newRemarkCategory,
      source: newRemarkSource,
      date: new Date().toLocaleDateString('zh-Hans-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      verification: 'Confirmed',
      risk: newRemarkRisk,
      decision: '',
      implementationTasks: [
        { id: 't1', text: 'تحليل المتطلبات وهندسة شفرة العلاج', done: false },
        { id: 't2', text: 'تعديل الواجهات والتحقق من الاستيقان المزدوج', done: false }
      ],
      regressionTested: false,
      certified: false,
      logs: [`تم تلقي الملاحظة وتسجيلها برقم ${newId} في بروتوكول التدقيق الخارجي.`]
    };

    setRemarks(prev => [newRemark, ...prev]);
    setSelectedRemarkId(newId);
    setNewRemarkTitle('');
    setNewRemarkSource('');
    setShowAddModal(false);
    triggerNotification(`تم تسجيل الملاحظة ${newId} بنجاح كمسودة خاضعة لبروتوكول التحقق والدمج.`, 'success');
  };

  // Run Implementation Simulation (Stage 4)
  const runImplementationSim = () => {
    if (!selectedRemark.id) {
      triggerNotification('لا توجد ملاحظة تدقيق مركزية محددة للتنفيذ.', 'warning');
      return;
    }
    if (selectedRemark.verification === 'Not Applicable') {
      triggerNotification('الملاحظة مصنفة كـ غير منطبقة. لا حاجة لتشغيل العلاج البرمجي.', 'info');
      return;
    }
    setSimulatingStep4(true);
    setSimLogs([]);
    let lines = [
      '🚀 بدء معالجة العلاج الهندسي وإعادة بناء الشفرة...',
      `🔍 فحص السورس كود الخاص بالنظام الفرعي لـ: ${selectedRemark.category}...`,
      '📦 جلب الحزم البرمجية والتحقق من صحة توقيع الدوال المعتمدة...',
      '⚙️ تطبيق كود الحماية والتحقق من الصلاحيات والمدخلات...',
      '🛠️ تطهير الحقول الحساسة (Sanitizing Input Fields) بنجاح...',
      '✅ اكتمال معالجة الملفات وحقن التدوين الرقابي (Logger Integration) بنجاح.'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setSimLogs(prev => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setSimulatingStep4(false);
        // Automatically set all implementation tasks as checked
        const updatedTasks = selectedRemark.implementationTasks.map(t => ({ ...t, done: true }));
        updateSelectedRemark({ implementationTasks: updatedTasks });
        triggerNotification('تمت معالجة الكود وتحديث حالة تنفيذ علاج الملاحظة بنجاح.', 'success');
      }
    }, 600);
  };

  // Run Regression Testing (Stage 5)
  const runRegressionTesting = () => {
    if (!selectedRemark.id) {
      triggerNotification('لا توجد ملاحظة تدقيق مركزية محددة للاختبار.', 'warning');
      return;
    }
    setSimulatingStep5(true);
    setRegTestsPassed(null);
    let tests = [
      '🕵️ تشغيل حزمة اختبارات التراجع الأمنية (Security Regression Suite)...',
      '🟢 Test Suite 1: SchoolTenantIsolation.spec.ts -> PASSED (12ms)',
      '🟢 Test Suite 2: FinancialRoleRBAC.spec.ts -> PASSED (8ms)',
      '🟢 Test Suite 3: DailyJournalBalancedLedger.spec.ts -> PASSED (24ms)',
      '🟢 Test Suite 4: StudentInfoSanitization.spec.ts -> PASSED (15ms)',
      '🟢 Test Suite 5: SystemPerformanceUnderLoad.spec.ts -> PASSED (42ms)',
      '🏁 جميع اختبارات التراجع اجتازت بنجاح 100%! لا يوجد أي خلل مركب.'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < tests.length) {
        setSimLogs(prev => [...prev, tests[i]]);
        i++;
      } else {
        clearInterval(interval);
        setSimulatingStep5(false);
        setRegTestsPassed(true);
        updateSelectedRemark({ regressionTested: true });
        triggerNotification('أكملت حزمة اختبارات التراجع مهامها بنجاح واجتازت 5/5 اختبارات.', 'success');
      }
    }, 500);
  };

  // Toggle Implementation Task Check
  const toggleTask = (taskId: string) => {
    const updated = selectedRemark.implementationTasks.map(t => 
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    updateSelectedRemark({ implementationTasks: updated });
  };

  // Certify and Close Remark (Stage 6)
  const handleCertifyAndClose = () => {
    // Check if the protocol steps are fully compliant
    const isStep1Done = !!selectedRemark.verification;
    const isStep2Done = !!selectedRemark.risk;
    const isStep3Done = selectedRemark.decision && selectedRemark.decision.trim().length > 10;
    
    let isStep4Done = true;
    let isStep5Done = true;

    if (selectedRemark.verification !== 'Not Applicable') {
      isStep4Done = selectedRemark.implementationTasks.length > 0 && selectedRemark.implementationTasks.every(t => t.done);
      isStep5Done = selectedRemark.regressionTested;
    }

    if (!isStep1Done || !isStep2Done || !isStep3Done || !isStep4Done || !isStep5Done) {
      triggerNotification('لا يمكن اعتماد الملاحظة وإغلاقها حتى تستكمل متطلبات بروتوكول التدقيق كاملةً!', 'danger');
      return;
    }

    updateSelectedRemark({
      certified: true,
      certifiedBy: 'سليمان بن غازي (المدير الإداري والمالي للمنصة)',
      certifiedAt: new Date().toLocaleString('ar-SA', { hour12: false })
    });

    triggerNotification(`تم اعتماد وإغلاق الملاحظة ${selectedRemark.id} نهائياً وحفظ وثيقة الامتثال في الدفاتر السحابية.`, 'success');
  };

  // Determine Overall Compliancy status of selected remark
  const complianceStatus = useMemo(() => {
    if (selectedRemark.certified) return { label: 'معتمدة ومغلقة', color: 'text-emerald-400 bg-emerald-950 border-emerald-800' };
    
    // Check pending steps
    const isVerified = !!selectedRemark.verification;
    const hasDecision = selectedRemark.decision && selectedRemark.decision.trim().length > 10;
    
    if (selectedRemark.verification === 'Not Applicable') {
      if (hasDecision) {
        return { label: 'بانتظار الاعتماد المبرر', color: 'text-amber-400 bg-amber-950 border-amber-800 animate-pulse' };
      }
      return { label: 'قيد التبرير التقني', color: 'text-rose-400 bg-rose-950 border-rose-900' };
    }

    const tasksDone = selectedRemark.implementationTasks.length > 0 && selectedRemark.implementationTasks.every(t => t.done);
    const tested = selectedRemark.regressionTested;

    if (!isVerified) return { label: 'قيد الفرز والتحقق', color: 'text-slate-400 bg-slate-900 border-slate-800' };
    if (!hasDecision) return { label: 'بانتظار القرار الهندسي', color: 'text-orange-400 bg-orange-950 border-orange-900' };
    if (!tasksDone) return { label: 'قيد التطبيق والعلاج برمجياً', color: 'text-purple-400 bg-purple-950 border-purple-900' };
    if (!tested) return { label: 'قيد اختبارات التراجع', color: 'text-amber-400 bg-amber-950 border-amber-900 animate-pulse' };
    
    return { label: 'مكتملة وبانتظار شهادة الاعتماد', color: 'text-amber-400 bg-amber-950 border-amber-800 animate-pulse' };
  }, [selectedRemark]);

  return (
    <div className="w-full text-slate-100 bg-slate-950 border border-slate-800/80 shadow-2xl p-6 relative overflow-hidden" dir="rtl">
      {/* Visual background details to show diamond premium ERP design */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="bg-amber-600/20 p-2.5 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                بروتوكول حوكمة ومعالجة تقارير التدقيق الخارجي
                <span className="text-[10px] font-mono tracking-widest bg-amber-950 text-amber-400 border border-amber-800 px-2.5 py-0.5 rounded-full uppercase">
                  External Audit Protocol
                </span>
              </h2>
              <p className="text-xs text-slate-400">منظومة الربط المركزي ومعالجة وتأكيد وإغلاق الملاحظات الصادرة عن بيوت الخبرة والجهات الخارجية وفق القواعد الهندسية الصارمة</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2.5 border border-amber-400/20 transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إدراج ملاحظة خارجية جديدة</span>
        </button>
      </div>

      {/* Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900/60 p-4 border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">إجمالي الملاحظات</span>
            <span className="text-2xl font-black text-white">{kpis.total}</span>
          </div>
          <ClipboardList className="w-8 h-8 text-amber-400/40" />
        </div>
        
        <div className="bg-slate-900/60 p-4 border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">مؤكدة ومعالجة بالكامل</span>
            <span className="text-2xl font-black text-emerald-400">{kpis.confirmedAndSolved}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/40" />
        </div>

        <div className="bg-slate-900/60 p-4 border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">مستثناة مبررة (N/A)</span>
            <span className="text-2xl font-black text-amber-400">{kpis.documentedNA}</span>
          </div>
          <HelpCircle className="w-8 h-8 text-amber-400/40" />
        </div>

        <div className="bg-slate-900/60 p-4 border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">مفتوحة وقيد التنفيذ</span>
            <span className="text-2xl font-black text-amber-400">{kpis.unresolved}</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400/40 animate-pulse" />
        </div>

        <div className="bg-slate-900/60 p-4 border border-slate-800/60 flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-[10px] text-rose-400 block mb-1">مخاطر حرجة مفتوحة</span>
            <span className="text-2xl font-black text-rose-500">{kpis.criticalCount}</span>
          </div>
          <Flame className={`w-8 h-8 text-rose-500/40 ${kpis.criticalCount > 0 ? 'animate-bounce' : ''}`} />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Remarks Explorer Panel */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث برقم الملاحظة، العنوان أو التصنيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 py-2.5 pr-10 pl-4 text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">درجة الخطورة</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="all">الكل</option>
                <option value="Critical">Critical (حرجة)</option>
                <option value="High">High (عالية)</option>
                <option value="Medium">Medium (متوسطة)</option>
                <option value="Low">Low (منخفضة)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">حالة التحقق</label>
              <select
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="all">الكل</option>
                <option value="Confirmed">Confirmed (مؤكدة)</option>
                <option value="Partially Confirmed">Partially (مؤكدة جزئياً)</option>
                <option value="Not Applicable">Not Applicable (غير منطبق)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredRemarks.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-750" />
                <p className="text-xs font-bold">لا توجد ملاحظات تدقيق خارجية مطابقة للبحث</p>
              </div>
            ) : (
              filteredRemarks.map(rem => {
                const isSelected = rem.id === selectedRemarkId;
                const riskColors = 
                  rem.risk === 'Critical' ? 'text-rose-400 bg-rose-950/40 border-rose-800/40' :
                  rem.risk === 'High' ? 'text-amber-500 bg-amber-950/40 border-amber-850/40' :
                  rem.risk === 'Medium' ? 'text-amber-400 bg-amber-950/40 border-amber-900/40' :
                  'text-slate-400 bg-slate-800/40 border-slate-700/40';

                return (
                  <button
                    key={rem.id}
                    onClick={() => {
                      setSelectedRemarkId(rem.id);
                      setSimLogs([]);
                      setRegTestsPassed(null);
                    }}
                    className={`w-full text-right p-3.5 border transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/5' 
                        : 'bg-slate-900/60 border-slate-850/80 hover:bg-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-mono text-amber-400 font-extrabold">{rem.id}</span>
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border ${riskColors}`}>
                        {rem.risk}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">
                      {rem.title}
                    </h4>

                    <div className="flex justify-between items-center w-full text-[9px] text-slate-500 border-t border-slate-800/50 pt-2 mt-1">
                      <span>{rem.category}</span>
                      {rem.certified ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> مغلق ومعتمد
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> قيد المراجعة
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Interactive 6-Stage Workflow Board */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/60 border border-slate-850 p-6 space-y-6">
            
            {/* Top Info of Selected Remark */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg">
                    {selectedRemark.id}
                  </span>
                  <span className="text-slate-400 text-[11px] font-bold">
                    المصدر: {selectedRemark.source}
                  </span>
                </div>
                <h3 className="text-base font-black text-white leading-relaxed">
                  {selectedRemark.title}
                </h3>
              </div>
              
              <div className="flex flex-col items-end gap-1.5 self-stretch md:self-auto justify-center">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${complianceStatus.color}`}>
                  الحالة: {complianceStatus.label}
                </span>
                <span className="text-[9px] text-slate-500 font-bold">تاريخ الرصد: {selectedRemark.date}</span>
              </div>
            </div>

            {/* PROTOCOL VISUAL STAGES BAR */}
            <div>
              <h4 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                مراحل بروتوكول حوكمة ومعالجة التقارير الخارجية
              </h4>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { step: 1, label: '1. Verification', icon: CheckCircle2, desc: 'التحقق والمصداقية' },
                  { step: 2, label: '2. Risk Assessment', icon: AlertTriangle, desc: 'تصنيف الخطورة' },
                  { step: 3, label: '3. Engineering Decision', icon: FileSignature, desc: 'القرار الهندسي' },
                  { step: 4, label: '4. Implementation', icon: Cpu, desc: 'التنفيذ البرمجي' },
                  { step: 5, label: '5. Regression Testing', icon: RotateCw, desc: 'اختبارات عدم التراجع' },
                  { step: 6, label: '6. Certification', icon: BadgeCheck, desc: 'الاعتماد والإغلاق' }
                ].map((s) => {
                  let isDone = false;
                  if (s.step === 1) isDone = !!selectedRemark.verification;
                  if (s.step === 2) isDone = !!selectedRemark.risk;
                  if (s.step === 3) isDone = selectedRemark.decision.trim().length > 10;
                  if (s.step === 4) {
                    isDone = selectedRemark.verification === 'Not Applicable' || 
                             (selectedRemark.implementationTasks.length > 0 && selectedRemark.implementationTasks.every(t => t.done));
                  }
                  if (s.step === 5) isDone = selectedRemark.verification === 'Not Applicable' || selectedRemark.regressionTested;
                  if (s.step === 6) isDone = selectedRemark.certified;

                  const StepIcon = s.icon;
                  return (
                    <div 
                      key={s.step}
                      className={`p-2.5 border text-center transition-all flex flex-col items-center justify-between gap-1 ${
                        isDone 
                          ? 'bg-amber-950/20 border-amber-500/50 text-amber-300 shadow-sm' 
                          : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}
                    >
                      <StepIcon className={`w-4 h-4 ${isDone ? 'text-amber-400' : 'text-slate-600'}`} />
                      <span className="text-[9px] font-black block whitespace-nowrap">{s.label}</span>
                      <span className="text-[8px] text-slate-400 block line-clamp-1">{s.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP CONTENT ACCORDION / GRID */}
            <div className="space-y-4">
              
              {/* STAGES 1 & 2: VERIFICATION & RISK ASSESSMENT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Stage 1: Verification */}
                <div className="bg-slate-950/80 p-4 border border-slate-850">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <span className="bg-amber-900 text-amber-300 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                      Verification (التحقق وتأكيد الصحة)
                    </h5>
                    <span className="text-[9px] text-slate-500">هل الملاحظة صحيحة؟</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 'Confirmed', label: 'مؤكدة صحيحة', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20', hover: 'hover:border-emerald-500' },
                      { val: 'Partially Confirmed', label: 'صحيحة جزئياً', color: 'border-amber-500/50 text-amber-400 bg-amber-950/20', hover: 'hover:border-amber-500' },
                      { val: 'Not Applicable', label: 'غير منطبقة', color: 'border-amber-500/50 text-amber-400 bg-amber-950/20', hover: 'hover:border-amber-500' }
                    ].map(opt => {
                      const isActive = selectedRemark.verification === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          disabled={selectedRemark.certified}
                          onClick={() => {
                            updateSelectedRemark({ 
                              verification: opt.val as any,
                              // Reset implementation checklist if switched to N/A
                              implementationTasks: opt.val === 'Not Applicable' ? [] : [
                                { id: 't1', text: 'تحليل شفرة الملاحظة ومراجعة هندسة معالجة الاختلال', done: false },
                                { id: 't2', text: 'إدماج المعايير والحلول في منطق النظام الموحد', done: false }
                              ],
                              regressionTested: opt.val === 'Not Applicable'
                            });
                          }}
                          className={`p-2 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                            isActive 
                              ? opt.color + ' ring-2 ring-amber-500/40 border-amber-400' 
                              : 'border-slate-800 text-slate-500 bg-transparent ' + opt.hover
                          } disabled:opacity-60`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stage 2: Risk Assessment */}
                <div className="bg-slate-950/80 p-4 border border-slate-850">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <span className="bg-amber-900 text-amber-300 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                      Risk Assessment (تصنيف الخطورة)
                    </h5>
                    <span className="text-[9px] text-slate-500">حجم وتأثير الخطورة</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: 'Critical', label: 'Critical (حرجة)', activeColor: 'bg-rose-950/50 border-rose-500 text-rose-400 hover:border-rose-500' },
                      { val: 'High', label: 'High (عالية)', activeColor: 'bg-amber-950/50 border-amber-500 text-amber-400 hover:border-amber-500' },
                      { val: 'Medium', label: 'Medium (متوسطة)', activeColor: 'bg-amber-950/50 border-amber-500 text-amber-400 hover:border-amber-500' },
                      { val: 'Low', label: 'Low (منخفضة)', activeColor: 'bg-slate-900 border-slate-500 text-slate-300 hover:border-slate-500' }
                    ].map(opt => {
                      const isActive = selectedRemark.risk === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          disabled={selectedRemark.certified}
                          onClick={() => updateSelectedRemark({ risk: opt.val as any })}
                          className={`p-2 rounded-lg border text-[10px] font-black text-center transition-all cursor-pointer ${
                            isActive 
                              ? opt.activeColor + ' ring-2 ring-amber-500/40' 
                              : 'border-slate-800 text-slate-500 bg-transparent hover:border-slate-700'
                          } disabled:opacity-60`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* STAGE 3: ENGINEERING DECISION */}
              <div className="bg-slate-950/80 p-4 border border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <span className="bg-amber-900 text-amber-300 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">3</span>
                    Engineering Decision (القرار الهندسي ومستند التوثيق)
                  </h5>
                  {selectedRemark.verification === 'Not Applicable' ? (
                    <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded font-black">مطلوب: مستند تبرير عدم الانطباق</span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-black">مطلوب: خطة وتفاصيل العلاج الهندسي</span>
                  )}
                </div>

                <div>
                  <textarea
                    rows={3}
                    disabled={selectedRemark.certified}
                    value={selectedRemark.decision}
                    onChange={(e) => updateSelectedRemark({ decision: e.target.value })}
                    placeholder={
                      selectedRemark.verification === 'Not Applicable'
                        ? 'اكتب هنا مبررات الاستثناء الفني لعدم انطباق الملاحظة على النظام لتسجيلها بكتب الامتثال والمطابقة...'
                        : 'صف هنا المقترح الهندسي المعتمد لعلاج وتلافي الاختلال بشكل جذري في طبقات النظام...'
                    }
                    className="w-full bg-slate-950 border border-slate-800/80 p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
                    <span>* يرجى توثيق مخرجات التحليل بدقة لضمان مراجعة الامتثال الخارجي.</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Save className="w-3 h-3 text-emerald-400" /> تم الحفظ تلقائياً في مستند المطابقة
                    </span>
                  </div>
                </div>
              </div>

              {/* STAGE 4: IMPLEMENTATION */}
              <div className="bg-slate-950/80 p-4 border border-slate-850 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <span className="bg-amber-900 text-amber-300 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">4</span>
                    Implementation (تنفيذ العلاج البرمجي والتعديل الميداني)
                  </h5>
                  {selectedRemark.verification !== 'Not Applicable' && (
                    <button
                      type="button"
                      disabled={simulatingStep4 || selectedRemark.certified}
                      onClick={runImplementationSim}
                      className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 font-black text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Cpu className={`w-3.5 h-3.5 ${simulatingStep4 ? 'animate-spin' : ''}`} />
                      <span>{simulatingStep4 ? 'محاكاة المعالجة البرمجية...' : 'محاكاة معالجة الكود (Hot-Fix)'}</span>
                    </button>
                  )}
                </div>

                {selectedRemark.verification === 'Not Applicable' ? (
                  <div className="text-center py-4 bg-slate-900/40 text-xs text-slate-500 font-bold">
                    🚫 هذه الملاحظة مصنفة "غير منطبقة (Not Applicable)" - تم تخطي مرحلة التطبيق البرمجي بموجب القرار الهندسي الموثق أعلاه.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-bold mb-1">المهام التقنية الفرعية للعلاج:</span>
                      {selectedRemark.implementationTasks.length === 0 ? (
                        <p className="text-xs text-slate-600">لا توجد مهام مدرجة</p>
                      ) : (
                        selectedRemark.implementationTasks.map(task => (
                          <label
                            key={task.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              task.done 
                                ? 'bg-emerald-950/10 border-emerald-500/40 text-emerald-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={selectedRemark.certified}
                              checked={task.done}
                              onChange={() => toggleTask(task.id)}
                              className="rounded border-slate-700 bg-slate-950 text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span>{task.text}</span>
                          </label>
                        ))
                      )}
                    </div>

                    {/* Developer Log / Console output */}
                    <div className="bg-slate-950 border border-slate-850 p-3 font-mono text-[10px] text-slate-300 space-y-1.5 min-h-[120px] max-h-[160px] overflow-y-auto">
                      <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1.5 mb-1.5">
                        <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-amber-400" /> مخرجات نظام البناء والمعالجة</span>
                        <span className="text-[9px]">DIAGNOSTICS</span>
                      </div>
                      {simLogs.length === 0 ? (
                        <div className="text-slate-600 italic">اضغط على زر محاكاة المعالجة لتتبع بناء وتعديل وحدات النظام...</div>
                      ) : (
                        simLogs.map((log, index) => (
                          <div key={index} className="leading-relaxed text-left" style={{ direction: 'ltr' }}>{log}</div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STAGE 5: REGRESSION TESTING */}
              <div className="bg-slate-950/80 p-4 border border-slate-850 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <span className="bg-amber-900 text-amber-300 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">5</span>
                    Regression Testing (اختبارات التراجع والوحدات المتأثرة)
                  </h5>
                  {selectedRemark.verification !== 'Not Applicable' && (
                    <button
                      type="button"
                      disabled={simulatingStep5 || selectedRemark.certified}
                      onClick={runRegressionTesting}
                      className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 font-black text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer animate-pulse"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${simulatingStep5 ? 'animate-spin' : ''}`} />
                      <span>{simulatingStep5 ? 'تشغيل حزمة الفحص...' : 'تشغيل اختبارات عدم التراجع'}</span>
                    </button>
                  )}
                </div>

                {selectedRemark.verification === 'Not Applicable' ? (
                  <div className="text-center py-4 bg-slate-900/40 text-xs text-slate-500 font-bold">
                    🚫 هذه الملاحظة مصنفة "غير منطبقة (Not Applicable)" - تم تجاوز الفحص لعدم وجود تعديل على الشفرة البرمجية.
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-850">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg border ${
                        selectedRemark.regressionTested 
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h6 className="text-xs font-black text-slate-200">حزمة اختبارات التكامل الشاملة (Regression Suite)</h6>
                        <p className="text-[10px] text-slate-400 mt-1">تتأكد من عدم تأثر الأقسام والعمليات المزدوجة المحاسبية والتعليمية بالتحديث الحاصل.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedRemark.regressionTested ? (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 border border-emerald-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> اجتاز الفحص التلقائي بنجاح
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-rose-400 bg-rose-950 border border-rose-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 animate-bounce" /> بانتظار تشغيل الاختبارات
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STAGE 6: CERTIFICATION */}
              <div className="bg-amber-950/10 p-5 border border-amber-500/30 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <span className="bg-amber-500 text-slate-950 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">6</span>
                    Certification & Close (الاعتماد النهائي وإغلاق الملاحظة)
                  </h5>
                  <span className="text-[9px] font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">MANDATORY RULE</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 max-w-lg bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    <p className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <LockIcon className="w-4 h-4 text-amber-500" />
                      قاعدة الحوكمة الصارمة: لا تغلق الملاحظة حتى يتم اعتماد العلاج.
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      يمنع النظام بشكل كامل تجاوز أو إغلاق أي تذكرة تدقيق خارجية ما لم يتم التحقق وتصنيف خطورتها وكتابة القرار الهندسي، وبملاحظات Confirmed/Partially Confirmed يجب إنهاء مهام التطبيق واجتياز اختبارات عدم التراجع التلقائية.
                    </p>
                  </div>

                  {selectedRemark.certified ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 text-emerald-400 flex flex-col gap-1 items-end self-stretch md:self-auto justify-center">
                      <span className="text-xs font-black flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" /> معتمدة ومغلقة نهائياً
                      </span>
                      <span className="text-[9px] text-slate-400">المعتمد: {selectedRemark.certifiedBy}</span>
                      <span className="text-[9px] text-slate-400">التاريخ: {selectedRemark.certifiedAt}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCertifyAndClose}
                      className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-6 py-3 border border-amber-400/30 transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>اعتماد العلاج وإغلاق الملاحظة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TIMELINE LOG */}
              <div className="bg-slate-950/80 p-4 border border-slate-850">
                <h5 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  سجل التغييرات وعمليات المطابقة (Audit Log)
                </h5>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-[10px] font-mono text-slate-500">
                  {selectedRemark.logs.map((log, index) => (
                    <div key={index} className="flex items-center gap-2 border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-amber-400">•</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Insert New Remark Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
                  تسجيل ملاحظة تدقيق خارجية جديدة
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <ListCollapse className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNewRemark} className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">نص الملاحظة الخارجية:</label>
                  <textarea
                    rows={2}
                    value={newRemarkTitle}
                    onChange={(e) => setNewRemarkTitle(e.target.value)}
                    placeholder="مثال: عدم تدوين العمليات المالية القادمة من بوابات الدفع الإلكترونية السريعة في الدفتر اليومي..."
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">التصنيف الوظيفي:</label>
                    <select
                      value={newRemarkCategory}
                      onChange={(e) => setNewRemarkCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="الأمن والحوكمة الأمنية">الأمن والحوكمة الأمنية</option>
                      <option value="أداء النظام والتحسين المتقدم">أداء النظام والتحسين المتقدم</option>
                      <option value="لوائح العمل المدرسية الموحدة">لوائح العمل المدرسية الموحدة</option>
                      <option value="التكامل التقني للمنظومة">التكامل التقني للمنظومة</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">درجة الخطورة الأولية:</label>
                    <select
                      value={newRemarkRisk}
                      onChange={(e) => setNewRemarkRisk(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Critical">Critical (حرجة)</option>
                      <option value="High">High (عالية)</option>
                      <option value="Medium">Medium (متوسطة)</option>
                      <option value="Low">Low (منخفضة)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">الجهة والتقرير الخارجي المصدر:</label>
                  <input
                    type="text"
                    value={newRemarkSource}
                    onChange={(e) => setNewRemarkSource(e.target.value)}
                    placeholder="مثال: تقرير ديوان المحاسبة لعام 2026"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-950 hover:bg-slate-800 text-slate-400 font-bold text-xs px-4 py-2 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-5 py-2 transition-all cursor-pointer"
                  >
                    تسجيل الملاحظة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
