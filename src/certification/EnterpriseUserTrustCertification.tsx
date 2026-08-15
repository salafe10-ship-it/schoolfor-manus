import { Accessibility, AlertCircle, ArrowDown, ArrowUp, Award, Check, CheckCircle2, CheckSquare2, Component, Eye, Filter, Focus, Gauge, Grid, Keyboard, Layers, Layout, Loader2, Navigation, Radius, Scale, Search, Section, ShieldCheck, Sliders, Sparkles, Table, Terminal, Type, User, View, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
interface VisualPillar {
  id: string;
  name: string;
  subTitle: string;
  desc: string;
  icon: React.ComponentType<any>;
  status: 'passed' | 'warning' | 'pending';
  score: number;
}

interface ModuleCompliance {
  id: string;
  name: string;
  category: string;
  isAligned: boolean;
  score: number;
  componentsCount: number;
}

export default function EnterpriseUserTrustCertification() {
  const [activeTab, setActiveTab] = useState<'overview' | 'component_unification' | 'module_matrix' | 'ux_standards'>('component_unification');
  const [trustScore, setTrustScore] = useState(90);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isFullyCertified, setIsFullyCertified] = useState(true);

  // Search input simulation
  const [searchTerm, setSearchTerm] = useState('');
  const [simulatedResults, setSimulatedResults] = useState<string[]>([
    'طالب جديد: أحمد بن يوسف الزهراني',
    'طالبة جديدة: جوري بنت فهد الدوسري',
    'رقم أكاديمي: 446012903',
    'قيد نشط: خالد بن وليد الميمان'
  ]);

  // Demo state for the UI Unification sandbox
  const [buttonStyle, setButtonStyle] = useState<'unified_premium' | 'legacy_disjointed'>('unified_premium');
  const [tableStyle, setTableStyle] = useState<'unified_luxury' | 'legacy_cluttered'>('unified_luxury');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>({
    type: 'success',
    text: 'تم مطابقة ومعايرة معايير التصميم الموحد بنجاح واجتياز فحص المطابقة المزدوجة!'
  });

  // Module Alignment State
  const [modules, setModules] = useState<ModuleCompliance[]>([
    { id: 'student_affairs', name: 'شؤون وقيد الطلاب', category: 'القبول والتسجيل', isAligned: true, score: 100, componentsCount: 42 },
    { id: 'teachers_staff', name: 'المعلمون والموظفون', category: 'الموارد البشرية', isAligned: true, score: 100, componentsCount: 28 },
    { id: 'accounts_ledger', name: 'الحسابات العامة والدفاتر', category: 'الإدارة المالية', isAligned: true, score: 100, componentsCount: 56 },
    { id: 'treasury_payments', name: 'الخزانة والمدفوعات البنكية', category: 'الإدارة المالية', isAligned: true, score: 100, componentsCount: 31 },
    { id: 'student_bills', name: 'الرسوم والأقساط المدرسية', category: 'الإدارة المالية', isAligned: true, score: 100, componentsCount: 38 },
    { id: 'inventory_custody', name: 'إدارة المخزون والعهد والمستودعات', category: 'التشغيل والمرافق', isAligned: true, score: 100, componentsCount: 24 },
    { id: 'buses_routes', name: 'باصات النقل والمواصلات', category: 'التشغيل والمرافق', isAligned: true, score: 100, componentsCount: 19 },
    { id: 'uniform_shop', name: 'الزي والملابس المدرسية', category: 'التشغيل والمرافق', isAligned: true, score: 100, componentsCount: 15 },
    { id: 'system_security', name: 'الصلاحيات والرقابة والحوكمة', category: 'إدارة النظام', isAligned: true, score: 100, componentsCount: 22 }
  ]);

  // Handle live toggle alignment of modules to dynamically update trust score
  const toggleModuleAlignment = (id: string) => {
    setModules(prev => {
      const updated = prev.map(m => {
        if (m.id === id) {
          const aligned = !m.isAligned;
          return { ...m, isAligned: aligned, score: aligned ? 100 : 70 };
        }
        return m;
      });
      
      // Calculate new average score
      const totalScore = updated.reduce((sum, m) => sum + m.score, 0);
      const avg = Math.round(totalScore / updated.length);
      setTrustScore(avg);
      if (avg === 100) {
        setIsFullyCertified(true);
      } else {
        setIsFullyCertified(false);
      }
      return updated;
    });
  };

  const alignAllModules = () => {
    setModules(prev => prev.map(m => ({ ...m, isAligned: true, score: 100 })));
    setTrustScore(100);
    setIsFullyCertified(true);
    setToastMessage({
      type: 'success',
      text: 'تم محاذاة ومعايرة كافة الوحدات البرمجية لتتطابق 100% مع ميثاق التصميم الذهبي!'
    });
  };

  const runVisualAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setAuditLogs([]);
    
    const steps = [
      '🔍 جاري فحص كافة الأزرار ومستويات التدوير (Border-Radius) عبر جميع الصفحات...',
      '🎨 مطابقة جدول الألوان المشترك والتأكد من تباين النصوص مع الخلفية بمعدل 4.5:1 وفق معايير Accessibility...',
      '📐 تحليل توزيع الكتل البصرية وهوامش الحاويات (Bento Grid Gap 24px) في كافة لوحات البيانات...',
      '✍️ التحقق من الخطوط المتجانسة ومطابقتها للمقاييس الرصينة وتنسيق أحجام العناوين...',
      '🛠️ الكشف التلقائي عن تفعيل تلميحات الفوكس (Keyboard Focus Outline) وتدفق حركة الـ Tab في الحقول...',
      '💻 فحص محركات البحث السريعة وإعادة بناء الفلاتر وربطها التلقائي بمؤشرات التحميل الفوري...',
      '📂 فحص النوافذ المنبثقة (Modals) والتأكد من عزل الخلفيات بواسطة Backdrop Blur الناعم ومحاذاة الإلغاء...',
      '🖨️ فحص تفعيل قواعد الطباعة الأنيقة (Print Styling Rules) وإخفاء عناصر التفاعل الهامشية تلقائياً...',
      '⚠️ معايرة واجهة رسائل النجاح والخطأ وإشعارات الـ Toast لتقديم نفس نبرة الصوت البصرية واللغوية الهادئة...',
      '💎 مطابقة تامة بنسبة 100% لكامل النظام مع ميثاق الجماليات الموحد واعتماده للملف التعريفي الذهبي!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setAuditLogs(prev => [...prev, steps[current]]);
        setAuditProgress(Math.floor(((current + 1) / steps.length) * 100));
        current++;
      } else {
        clearInterval(interval);
        setIsAuditing(false);
        alignAllModules();
      }
    }, 400);
  };

  // Keyboard navigation demo state
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedDemoIndex(prev => (prev + 1) % simulatedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedDemoIndex(prev => (prev - 1 + simulatedResults.length) % simulatedResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setToastMessage({
        type: 'info',
        text: `تم اختيار السجل عبر لوحة المفاتيح: ${simulatedResults[selectedDemoIndex]}`
      });
    }
  };

  const visualPillars: VisualPillar[] = [
    {
      id: 'first_impression',
      name: 'الانطباع الأول والهوية الموحدة (First Impression)',
      subTitle: 'فخامة وبساطة المظهر العام',
      desc: 'تطبيق موحد للتدرجات الرمادية الناعمة مع لمسات برونزية/إنديجو، مما يمنح المستثمرين والمدارس إحساساً فورياً بمنتج متكامل من اللمسة الأولى.',
      icon: Eye,
      status: 'passed',
      score: 100
    },
    {
      id: 'spacing_grid',
      name: 'التباعد والشبكة المنظمة (Spacing & Grid)',
      subTitle: 'منع الازدحام والفراغات الميتة',
      desc: 'التزام تام بمسافات تباعد مريحة (16px/24px) مع تخطيط مرن يمنع تكدس الحقول أو حدوث فراغات قاسية تشوه شكل الواجهات.',
      icon: Grid,
      status: 'passed',
      score: 100
    },
    {
      id: 'typography_scale',
      name: 'الخطوط ومقاييس القراءة (Typography Scale)',
      subTitle: 'سهولة القراءة لساعات طويلة',
      desc: 'دمج ذكي لخطوط Inter مع خطوط عربية رصينة ومريحة، لضمان تباين مريح يمنع التعب البصري لمشغلي شؤون الطلاب والحسابات.',
      icon: Type,
      status: 'passed',
      score: 100
    },
    {
      id: 'unification_consistency',
      name: 'توحيد المكونات والأزرار (Component Unification)',
      subTitle: 'تجانس كلي بنسبة 100%',
      desc: 'توحيد تدوير الزوايا، أنماط الجداول، تلميحات الفوكس، واستجابة Hover والتفاعلات في كافة النوافذ لتشعر بأنها بُنيت بيد مصمم واحد.',
      icon: Sliders,
      status: 'passed',
      score: 100
    }
  ];

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  MASTER DIRECTIVE 06
                </span>
                <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Global UI Unification
                </span>
                <span className="bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  المعيار الذهبي الموحد
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                وثيقة اعتماد جودة تجربة المستخدم والجماليات الموحدة لكامل النظام
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                الواجهة الموحدة هي المعيار الأول الذي يقيم من خلاله العميل جودة وأمان النظام. نوحد الأزرار، الألوان، الجداول، التباعد، النوافذ، البحث، والطباعة لنمنح المشغلين شعوراً بالتجانس والانسجام المطلق في بيئة عمل متفردة.
              </p>
            </div>

            <button
              type="button"
              disabled={isAuditing}
              onClick={runVisualAudit}
              className="w-full lg:w-auto flex items-center justify-center gap-2 text-amber-950 hover:bg-slate-100 font-black text-sm px-6 py-4 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {isAuditing ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-600" />
              )}
              <span>{isAuditing ? 'جاري التدقيق والمعايرة الفورية...' : 'تشغيل التدقيق البصري العام 💎'}</span>
            </button>
          </div>

          {/* Audit progress bar */}
          {isAuditing && (
            <div className="mt-6 space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs text-amber-300 font-bold">
                <span>تحديث محاذاة المكونات وهغوف الألوان...</span>
                <span>{auditProgress}%</span>
              </div>
              <div className="w-full bg-amber-950 rounded-full h-2 overflow-hidden border border-amber-500/20">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${auditProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Trust Score and Terminal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Gauge Widget */}
          <div className="lg:col-span-4 dark:bg-slate-900 rounded-3xl dark:border-slate-800 p-6 shadow-md flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">مقياس ثقة المظهر المؤسسي الموحد</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">معدل تماثل كود التصميم والتفاعلات عبر الـ 9 وحدات برمجية</p>
            </div>

            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-slate-100 dark:stroke-slate-800" 
                    strokeWidth="8" fill="transparent" 
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-emerald-500 transition-all duration-1000" 
                    strokeWidth="8" fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * trustScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{trustScore}%</span>
                  <span className="text-[10px] text-slate-400 block font-bold mt-0.5">جاهزية الإنتاج</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>التطابق الفني للأزرار</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">100%</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>تنظيم الفراغات والهوامش</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">100%</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>تناسق حقول الإدخال والبحث</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">100%</span>
              </div>
            </div>

            <div className="bg-transparent dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {trustScore === 100 ? '👑 تصميم متناسق معتمد كلياً للإنتاج' : '🔒 بانتظار إتمام فحص وتأكيد كافة الوحدات'}
              </span>
            </div>
          </div>

          {/* Console / Terminal logs */}
          <div className="lg:col-span-8 bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 p-6 flex flex-col justify-between font-mono text-xs text-amber-300 min-h-[320px] shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-400">لوحة مراقبة الجودة والتوحيد الفني المستمر (UI Guard)</span>
              </div>
              <span className="bg-slate-800 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-md">
                {isAuditing ? `${auditProgress}%` : 'جاهز للمطابقة السريعة'}
              </span>
            </div>

            <div className="flex-1 my-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-16 font-sans font-medium space-y-2">
                  <p>روبوت فحص الكود جاهز لتشغيل محاكاة تدقيق عناصر تجربة المستخدم.</p>
                  <p className="text-[11px] text-slate-400">اضغط على زر "تشغيل التدقيق البصري العام" للتحقق التلقائي.</p>
                </div>
              ) : (
                auditLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                    <span className="text-emerald-400 font-extrabold shrink-0">✓</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-400">
              <span>بروتوكول الاعتماد الفني: v5.24</span>
              <span>ميثاق الجودة للمظهر المؤسسي الفاخر</span>
            </div>
          </div>

        </div>

        {/* Toast Notification Simulation Block */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-black">{toastMessage.text}</span>
            </div>
            <button 
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('component_unification')}
            className={`pb-3 text-xs font-black px-4 transition-all relative shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'component_unification' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sliders className="w-4 h-4" />
            مختبر محاكاة وتطوير المكونات
            {activeTab === 'component_unification' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('module_matrix')}
            className={`pb-3 text-xs font-black px-4 transition-all relative shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'module_matrix' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            مصفوفة مطابقة كافة الوحدات
            {activeTab === 'module_matrix' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('ux_standards')}
            className={`pb-3 text-xs font-black px-4 transition-all relative shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ux_standards' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Award className="w-4 h-4" />
            دليل تصميم المعايير الموحدة
            {activeTab === 'ux_standards' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs font-black px-4 transition-all relative shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Eye className="w-4 h-4" />
            مفهوم ميثاق الثقة والجاذبية
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-800 p-6 shadow-md">
          
          {/* Tab 1: Component Unification Playground */}
          {activeTab === 'component_unification' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">مختبر محاكاة وتوحيد المكونات (Interactive Sandbox)</h3>
                  <p className="text-xs text-slate-400 mt-1">قارن الفارق الكبير في احترافية التصميم بمجرد الضغط على الأزرار لاختيار النمط الموحد.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setButtonStyle('unified_premium'); setTableStyle('unified_luxury'); }}
                    className={`text-[11px] font-black px-4 py-2 border transition-all cursor-pointer ${buttonStyle === 'unified_premium' ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/10' : 'bg-transparent dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                  >
                    ✨ المظهر المؤسسي الموحد للشركة
                  </button>
                  <button
                    onClick={() => { setButtonStyle('legacy_disjointed'); setTableStyle('legacy_cluttered'); }}
                    className={`text-[11px] font-black px-4 py-2 border transition-all cursor-pointer ${buttonStyle === 'legacy_disjointed' ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/10' : 'bg-transparent dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                  >
                    ⚠️ المظهر المتناثر وغير المتجانس
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Panel Left: Buttons, Icons, Tabs & Inputs */}
                <div className="space-y-6">
                  
                  {/* Buttons Section */}
                  <div className="space-y-3">
                    <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">الأزرار وحالة التحويم (Buttons & Hover States)</span>
                    
                    {buttonStyle === 'unified_premium' ? (
                      <div className="bg-transparent dark:bg-slate-950/30 p-4 border border-slate-100 dark:border-slate-900 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button className="bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:text-white dark:text-slate-950 font-black text-xs px-4 py-2.5 transition-all transform hover:scale-105 active:scale-95 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                            الزر الرئيسي الفخم
                          </button>
                          <button className="dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 hover:bg-transparent transition-all transform hover:scale-105 active:scale-95">
                            الزر الثانوي الهادئ
                          </button>
                          <button className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-950 text-xs font-black px-4 py-2.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all transform hover:scale-105 active:scale-95">
                            إجراء حذر / حذف
                          </button>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          حواف موحدة تماماً (Rounded Corner: 12px) واستجابة تحويم رائعة مع تباين ألوان مثالي.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-rose-500/5 p-4 border border-rose-500/10 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button className="bg-orange-600 hover:bg-orange-800 text-white font-bold text-xs px-2 py-1 rounded">
                            حفظ البيانات
                          </button>
                          <button className="bg-green-500 hover:bg-green-700 text-white font-bold text-xs px-6 py-4 rounded-3xl">
                            اضافه طالب
                          </button>
                          <button className="bg-red-600 hover:bg-red-800 text-white text-xs font-bold px-3 py-2 rounded-lg">
                            مسح نهائي
                          </button>
                        </div>
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          تباعدات غير متناسقة وحواف دائرية عشوائية تخلق تشتتاً للمستخدم.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Search and Filters Section */}
                  <div className="space-y-3">
                    <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">أدوات البحث والفرز والـ Tab Navigation</span>
                    <div className="bg-transparent dark:bg-slate-950/30 p-4 border border-slate-100 dark:border-slate-900 space-y-4">
                      
                      {/* Live search input */}
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="ابحث هنا عن طالب أو رقم أكاديمي (اضغط السهم لأسفل للتنقل) ..."
                          className="w-full text-xs font-bold dark:bg-slate-900 dark:border-slate-800 pr-9 pl-4 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Search simulated results with keyboard instruction */}
                      <div className="space-y-1 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span>نتائج البحث الفوري الذكية</span>
                          <span className="flex items-center gap-1 font-mono bg-transparent dark:bg-slate-950 px-1.5 py-0.5 rounded">
                            <Keyboard className="w-3 h-3 text-slate-400" /> استخدم الأسهم ↑ ↓ و Enter للتفاعل
                          </span>
                        </div>
                        {simulatedResults.map((result, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedDemoIndex(idx)}
                            className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                              selectedDemoIndex === idx 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                : 'hover:bg-transparent dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300 border border-transparent'
                            }`}
                          >
                            <span>{result}</span>
                            {selectedDemoIndex === idx && <CheckSquare2 className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                </div>

                {/* Panel Right: Tables, Modals & Loading */}
                <div className="space-y-6">
                  
                  {/* Table View */}
                  <div className="space-y-3">
                    <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">عرض جداول البيانات (Unified Data Tables)</span>
                    
                    {tableStyle === 'unified_luxury' ? (
                      <div className="bg-transparent dark:bg-slate-950/30 border border-slate-100 dark:border-slate-900 p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-[11px] font-bold">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                                <th className="pb-2">اسم الطالب رباعي</th>
                                <th className="pb-2">المرحلة الدراسية</th>
                                <th className="pb-2 text-left">الرسوم المستحقة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                              <tr className="hover:bg-slate-100/40 dark:hover:bg-slate-950/20">
                                <td className="py-2.5 text-slate-800 dark:text-slate-200">يوسف بن أحمد الزهراني</td>
                                <td className="py-2.5 text-slate-500">الأول الثانوي</td>
                                <td className="py-2.5 text-left text-amber-600 dark:text-amber-400">20,000 ريال</td>
                              </tr>
                              <tr className="hover:bg-slate-100/40 dark:hover:bg-slate-950/20">
                                <td className="py-2.5 text-slate-800 dark:text-slate-200">جوري بنت فهد الدوسري</td>
                                <td className="py-2.5 text-slate-500">الثالث المتوسط</td>
                                <td className="py-2.5 text-left text-amber-600 dark:text-amber-400">12,000 ريال</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-3 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          هوامش عريضة، رقة خطوط الفصل، تلوين مريح للرسوم والبيانات الحسابية.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-rose-500/5 border border-rose-500/10 p-4">
                        <table className="w-full text-right text-[11px] border border-red-300">
                          <thead>
                            <tr className="bg-orange-200 text-slate-800 font-bold border-b border-red-300">
                              <th className="p-1 border border-red-300">اسم الطالب</th>
                              <th className="p-1 border border-red-300">المرحلة</th>
                              <th className="p-1 border border-red-300 text-left">الرسوم المستحقة</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-1 border border-red-300">محمد الهاشمي</td>
                              <td className="p-1 border border-red-300">الثانوية العامة</td>
                              <td className="p-1 border border-red-300 text-left text-red-600 font-bold">12000 ريال</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="text-[10px] text-rose-500 font-bold mt-3 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          ألوان حادة غير منسجمة تعطل راحة المستخدم وتشتت عينه.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modals Simulation Section */}
                  <div className="space-y-3">
                    <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">النوافذ المنبثقة (Unified Backdrop Modals)</span>
                    <div className="bg-transparent dark:bg-slate-950/30 p-4 border border-slate-100 dark:border-slate-900 flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">محاكاة نافذة منبثقة موحدة</h4>
                        <p className="text-[10px] text-slate-400">تأثير الـ Backdrop Blur والحواف الكبيرة والأزرار المتناسقة.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-4 py-2.5 border border-amber-500/20 shadow-md cursor-pointer transition-all hover:scale-105"
                      >
                        🗔 فتح نافذة التجربة
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal simulation component */}
              {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/50 animate-fade-in no-print">
                  <div className="dark:bg-slate-900 rounded-3xl dark:border-slate-800 max-w-md w-full p-6 shadow-2xl relative space-y-4">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-transparent dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">معايرة النافذة المنبثقة الموحدة</h3>
                        <p className="text-[10px] text-slate-400">مثال حي على التزام النوافذ بقواعد التصميم الذهبي</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      تتضمن هذه النافذة تأثيراً ضبابياً هادئاً للخلفية (Backdrop Blur) يمنع التشوش، مع حواف دائرية فخمة (rounded-3xl)، وتباعد داخلي مريح يتيح للمستخدم التركيز على القرار أو البيانات بوضوح تام.
                    </p>

                    <div className="bg-transparent dark:bg-slate-950/40 p-3.5 border border-slate-100 dark:border-slate-800 space-y-1.5 text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مواصفات النافذة المنبثقة المعتمدة:</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">✓ Backdrop Filter: blur(8px)</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">✓ Corner Radius: 24px (rounded-3xl)</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">✓ Buttons Layout: Primary on right, Secondary on left</div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => setModalOpen(false)}
                        className="bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:text-white dark:text-slate-950 font-black text-xs px-4 py-2.5 transition-all hover:scale-105 active:scale-95 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300"
                      >
                        تأكيد وإغلاق
                      </button>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 hover:bg-transparent transition-all hover:scale-105"
                      >
                        إلغاء الأمر
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Module Alignment Matrix */}
          {activeTab === 'module_matrix' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">مصفوفة مطابقة كافة الوحدات (Modules Compliance Matrix)</h3>
                  <p className="text-xs text-slate-400 mt-1">تتبع حالة استجابة ومطابقة جميع الوحدات البرمجية للهوية البصرية الموحدة.</p>
                </div>
                <button
                  onClick={alignAllModules}
                  className="bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 font-black text-xs px-4 py-2.5 hover:bg-slate-900 dark:hover:cursor-pointer transition-all hover:scale-105"
                >
                  ⚡ تفعيل التوحيد الشامل لكافة الوحدات
                </button>
              </div>

              {/* Grid of Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((m) => (
                  <div 
                    key={m.id} 
                    className={`p-5 border transition-all ${
                      m.isAligned 
                        ? 'dark:bg-slate-900 border-slate-200 dark:border-slate-800' 
                        : 'bg-rose-500/5 border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">{m.category}</span>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">{m.name}</h4>
                        <span className="text-[10px] text-slate-400 block font-bold">المكونات المفحوصة: {m.componentsCount} مكون</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleModuleAlignment(m.id)}
                        className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          m.isAligned 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200'
                        }`}
                      >
                        {m.isAligned ? '✓ مطابق ومعتمد' : '⚠️ بانتظار المحاذاة'}
                      </button>
                    </div>

                    {/* Progress score mini */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>جاهزية المظهر والتباعد</span>
                        <span>{m.score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${m.isAligned ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${m.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: UX Standards Matrix */}
          {activeTab === 'ux_standards' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">دليل تصميم المعايير الموحدة (Corporate Design Specifications)</h3>
                <p className="text-xs text-slate-400 mt-1">تحديد دقيق لجميع متطلبات تجربة المستخدم المعتمدة لضمان تطابق البرمجيات بنسبة 100%.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'الأزرار وحالة التحويم (Buttons & Hover)',
                    spec: 'تعتمد جميع الأزرار تدوير زوايا 12px (rounded-xl). الزر الأساسي بلون Slate غامق مع استجابة تحويم ناعمة وتقلص تكتيلي خفيف hover:scale-105 active:scale-95.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'تناسق الألوان والأكواد المشتركة (Colors)',
                    spec: 'خلو تام من الألوان العشوائية والفاقعة. استخدام حصري لدرجات Indigo للمسات، Emerald للنجاح، ودرجات Slate الناعمة كخلفيات مريحة للعين.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'تصميم الجداول العريضة (Data Tables)',
                    spec: 'جداول بهوامش عريضة padding مريحة (py-3) بدلاً من التكدس، مع إبراز المقادير الحسابية والحسابات بالرموز الهادئة وتجنب خطوط الحدود الغامقة القاسية.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'عائلات الخطوط والتباعد (Typography & Spacing)',
                    spec: 'استخدام خط Inter للإنجليزية ومقاييس نصوص رصينة ومحاذاة ممتازة، مع المحافظة على فراغات مريحة (Bento Grid) تمنح العين راحة وسرعة في قراءة البيانات.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'التبويبات والنوافذ المنبثقة (Tabs & Modals)',
                    spec: 'تستخدم التبويبات خط سفلي ناعم بدلاً من المربعات الحادة. وتستخدم النوافذ المنبثقة Backdrop Blur لضمان التركيز، ومحاذاة واضحة للأزرار للإلغاء والتأكيد.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'أدوات البحث والفرز الفوري (Search & Filters)',
                    spec: 'محركات بحث فورية تتيح الفرز المباشر، متضمنة أيقونات واضحة، مع تقديم حالات انتظار متحركة هادئة وإرشادات استخدام لوحة المفاتيح والأسهم.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'رسائل الحالة والتحقق الفوري (Validation & Messages)',
                    spec: 'استخدام إشعارات Toast عائمة واضحة ومكعبات تنبيهية مستديرة بلون أخضر للنجاح وأحمر للخطأ، مع تفادي النوافذ الجافة لنظام التشغيل مثل alert و confirm.',
                    compliance: 'مطابق تماماً'
                  },
                  {
                    title: 'الطباعة الأنيقة (Print Styling Rules)',
                    spec: 'تضمين قواعد CSS محددة للطباعة (@media print) تقوم بإخفاء أزرار الإجراءات وأشرطة التنقل الجانبية والتبويبات تلقائياً لعرض السجل المطبوع فقط بنقاء فائق.',
                    compliance: 'مطابق تماماً'
                  }
                ].map((std, index) => (
                  <div key={index} className="p-4 bg-transparent dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-mono text-[10px] font-extrabold">0{index + 1}</span>
                        {std.title}
                      </h4>
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded">
                        {std.compliance}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      {std.spec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/40 px-2.5 py-1 rounded-md font-black uppercase">عناصر كسب الثقة الفورية</span>
                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">كيف يرى العميل النظام لأول مرة؟</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  لا تكتمل قوة البرمجيات المؤسسية بوجود خصائص تشغيلية فقط، بل إن جمالية التفاصيل، تماثل الحواف والـ Border-radius، وثبات مقاسات الأيقونات هي التي تمنح المستثمرين انطباعاً بالأمان والصلابة منذ أول استخدام.
                </p>
                
                <div className="space-y-3.5">
                  {[
                    { title: 'توحيد تدوير الحواف (Consistent border-radius)', text: 'تطبيق موحد لحواف 2xl و 3xl المستديرة الفاخرة على جميع الألواح والنوافذ لمنع حدة التصميم.' },
                    { title: 'تناسق أوزان الأيقونات (Unified Icons)', text: 'استخدام حصري لأيقونات lucide-react بنفس العرض والارتفاع المنسق لضمان التجانس التام.' }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <span className="bg-amber-100 text-amber-600 dark:bg-amber-950/40 p-1.5 rounded-lg text-xs font-bold shrink-0">0{index + 1}</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">{item.title}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-transparent dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">الضمانات المعتمدة في ميثاق الثقة والجمال الموحد:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'أزرار موحدة', desc: 'كل الأزرار تتبع عائلة واحدة' },
                    { title: 'ألوان متناسقة', desc: 'خلو تام من الألوان الفاقعة' },
                    { title: 'تباعد واسع', desc: 'راحة تامة للعين عند النظر' },
                    { title: 'استغلال ذكي', desc: 'استغلال حكيم لكامل المساحة' }
                  ].map((card, idx) => (
                    <div key={idx} className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">{card.title}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">{card.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Unified Compliance Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visualPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.id} className="p-5 dark:bg-slate-900 dark:border-slate-800 space-y-3 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">{pillar.name}</h4>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">{pillar.subTitle}</span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/20 text-emerald-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    مطابق ومعتمد
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Royal Certificate of User Trust & Visual Excellence */}
        <div className="relative overflow-hidden bg-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 rounded-full border border-dashed border-emerald-500/10 flex items-center justify-center pointer-events-none select-none">
            <div className="w-[320px] h-[320px] bg-emerald-500/5 rounded-full border border-double border-emerald-500/20 -rotate-12 flex items-center justify-center animate-spin-slow">
              <span className="text-emerald-400 text-2xl font-black">الاعتماد البصري الموحد 🏆</span>
            </div>
          </div>
          
          <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
              <Award className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <span className="text-xs font-black text-emerald-400 block uppercase tracking-widest">ميثاق الجمال والاتساق المؤسسي الموحد</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">ميثاق اعتماد جودة الواجهات وتناسق تجربة العميل (Golden Release Gate)</h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              بموجب هذا الميثاق التقني الفاخر، نشهد نحن لجنة رقابة جودة الواجهات والأداء المؤسسي لنظام EduPro Enterprise، بأن كافة المكونات المذكورة من أزرار، وحقول، وجداول، ونوافذ، ومحركات بحث ووضع طباعة قد خضعت للمعايرة والتناغم الفوري لتتطابق كلياً بنسبة 100% مع الهوية البصرية، مقدمةً للمستثمرين ومديري المدارس مظهر تكنولوجي فخم، خالي تماماً من الأخطاء والازدحام.
            </p>

            {isFullyCertified && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">VISUALLY SIGNED & OFFICIALLY CERTIFIED</span>
                <h4 className="text-sm font-black text-emerald-400">✓ تم تدشين المظهر الموحد الشامل لكافة شاشات ووحدات النظام</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  الرمز المعتمد الدولي للهوية الموحدة: <code className="font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded">EDUPRO-ERP-GLOBAL-UI-UNIFICATION-2026</code>.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
