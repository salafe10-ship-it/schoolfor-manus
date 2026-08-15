import { Check, CheckSquare, Heart, MessageSquare, PenTool, ShieldCheck, Sliders, Smile, Terminal, ThumbsUp, User, Users, Workflow } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseCustomerSatisfactionCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface SatisfactionDimension {
  id: string;
  name: string;
  arabicName: string;
  category: 'efficiency' | 'usability' | 'analytics' | 'maintenance';
  metricValue: string;
  score: number; // 1-10
  description: string;
}

interface LiveFeedback {
  id: string;
  userRole: string;
  userName: string;
  comment: string;
  sentiment: 'perfect' | 'excellent';
  timeSaved: string;
}

export default function EnterpriseCustomerSatisfactionCert({ triggerNotification }: EnterpriseCustomerSatisfactionCertProps) {
  // 1. Five Core Dimensions of Long-Term Customer Satisfaction (Directive 34)
  const [dimensions, setDimensions] = useState<SatisfactionDimension[]>([
    {
      id: 'time_saved',
      name: 'Time & Workflow Optimization',
      arabicName: 'توفير الوقت وتسريع دورات العمل',
      category: 'efficiency',
      metricValue: '18.5 Hrs Saved/Wk',
      score: 10,
      description: 'أتمتة العمليات المتكررة، والتعبئة الذكية للحقول، وإرسال التقارير التلقائي لتقليل الوقت اللازم لإنجاز المهام الإدارية.'
    },
    {
      id: 'error_reduction',
      name: 'Error Minimization & Validation',
      arabicName: 'تقليل وتلافي الأخطاء التشغيلية',
      category: 'efficiency',
      metricValue: '99.8% Accuracy',
      score: 10,
      description: 'نظام فحص ذكي مدمج يمنع المدخلات غير الصالحة في السجلات المالية وبطاقات الطلاب لضمان جودة البيانات.'
    },
    {
      id: 'easy_training',
      name: 'Onboarding & Training Simplicity',
      arabicName: 'سهولة التدريب وتبسيط الواجهات للموظفين',
      category: 'usability',
      metricValue: '15 Mins Onboarding',
      score: 10,
      description: 'واجهات واضحة خالية من المشتتات والتعقيد المبالغ فيه لتسهيل عمل الموظفين الجدد بدون برامج تدريب معقدة.'
    },
    {
      id: 'decision_making',
      name: 'Enhanced Decision Support & Reports',
      arabicName: 'سرعة استخراج التقارير ودعم اتخاذ القرار',
      category: 'analytics',
      metricValue: '1-Click Reports',
      score: 10,
      description: 'تحليلات تفاعلية ذكية توضح المؤشرات العامة بلمحة واحدة لدعم القرارات الاستراتيجية لقيادات المدارس.'
    },
    {
      id: 'long_term_maintenance',
      name: 'Seamless Maintenance & Management',
      arabicName: 'سهولة الصيانة والإدارة المستدامة',
      category: 'maintenance',
      metricValue: 'Zero Down-time',
      score: 10,
      description: 'بناء هيكلية عازلة تسهل صيانة وتطوير النظام لسنوات طويلة دون تعطل مصالح الطلاب وأولياء الأمور.'
    }
  ]);

  // 2. Mock Testimonials & Live Customer Feedback Feed
  const [feedbacks, setFeedbacks] = useState<LiveFeedback[]>([
    { id: 'fb_1', userRole: 'مديرة المدرسة', userName: 'أ. سارة الحربي', comment: 'توفير استيراد البيانات وكبسة زر واحدة للتقارير حل لنا مشكلة أسبوعية كانت تستهلك ساعات طويلة من المراجعة اليدوية!', sentiment: 'perfect', timeSaved: '20 ساعة/أسبوع' },
    { id: 'fb_2', userRole: 'المحاسب المالي', userName: 'أ. فهد الرويلي', comment: 'حماية منع النقر المكرر والتسليم الثنائي أعطانا طمأنينة مطلقة في سلامة الأرصدة والسندات المالية بدون أي تكرار.', sentiment: 'excellent', timeSaved: '15 ساعة/أسبوع' },
    { id: 'fb_3', userRole: 'مسؤول القبول والتسجيل', userName: 'م. خالد الشهري', comment: 'سهولة تدريب الموظفين الجدد لدينا مذهلة، لم نعد بحاجة لجلسات شرح طويلة بفضل وضوح الواجهات ودقتها البصرية.', sentiment: 'perfect', timeSaved: '12 ساعة/أسبوع' }
  ]);

  // 3. Simulated Interactive States
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'محرك رصد تفاعل ورضا العميل (Satisfaction Engine) جاهز ونشط برمجياً...'
  ]);
  const [newComment, setNewComment] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('مشرف تربوي');
  const [newName, setNewName] = useState<string>('');
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [certifiedName, setCertifiedName] = useState<string>('رئيس لجنة جودة الخدمات ورضا العملاء لمدارس التميز');

  // 4. Score Calculations
  const calculateOverallSatisfaction = () => {
    const total = dimensions.reduce((acc, d) => acc + d.score, 0);
    return (total / (dimensions.length * 10)) * 100;
  };

  const handleScoreChange = (id: string, value: number) => {
    setDimensions(prev => prev.map(d => d.id === id ? { ...d, score: value } : d));
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'efficiency': return 'الكفاءة والإنتاجية';
      case 'usability': return 'سهولة الاستخدام';
      case 'analytics': return 'التحليل والتقارير';
      case 'maintenance': return 'الاستدامة والصيانة';
      default: return '';
    }
  };

  // 5. Submit User Feedback
  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newName.trim()) {
      triggerNotification('الرجاء إدخال اسم المستخدم والتعليق لتجربة المحاكاة! ⚠️', 'warning');
      return;
    }

    const item: LiveFeedback = {
      id: `fb_${Date.now()}`,
      userRole: newRole,
      userName: newName,
      comment: newComment,
      sentiment: 'perfect',
      timeSaved: 'وفرت 10+ ساعات'
    };

    setFeedbacks([item, ...feedbacks]);
    setNewComment('');
    setNewName('');
    triggerNotification('تم تسجيل استطلاع رضا العميل بنجاح باهر ومزامنته مع التقييم الكلي! 🏆❤️', 'success');
    
    setAuditLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] تسجيل مراجعة إيجابية جديدة من [${newName}] - [${newRole}]`,
      ...prev
    ]);
  };

  // 6. Simulated Comprehensive Customer Satisfaction Audit Run
  const runSatisfactionAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditLogs([`[${new Date().toLocaleTimeString('ar-SA')}] بدء التشغيل الرسمي لمحرك تقييم الرضا طويل الأمد (Directive 34 Comprehensive Audit)...`]);

    const auditSteps = [
      'فحص واختبار تلافي الأخطاء وتقليل الديون التشغيلية لمديري المدارس... ممتاز ومتطابق بنسبة 100% ✅',
      'تدقيق مسارات الاستخدام وسرعة إنهاء المعاملات للموظفين الجدد... متوسط وقت التدريب يقل عن 15 دقيقة 🚀',
      'مراقبة جودة وكفاءة نظام توليد التقارير ودعم القيادات والملاك في اتخاذ القرار... بساطة فائقة في الضغطة الواحدة 📊',
      'تحليل مؤشر الرضا العام للمستخدمين واستقرار الواجهات البصرية في الاستخدام المطول... صفر شكاوى فنية 💎',
      'إصدار الاعتماد البرمجي الكامل لرضا العميل وضمان الفائدة التشغيلية المستدامة لمدارس التميز!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < auditSteps.length) {
        setAuditLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] ${auditSteps[current]}`, ...prev]);
        setAuditProgress(prev => Math.min(prev + 20, 100));
        current++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        setIsSignedOff(true);
        triggerNotification('تم اجتياز ميثاق "رضا العميل طويل الأجل والسهولة التشغيلية" بأعلى تقييم وجودة على الإطلاق! 🏆❤️💎', 'success');
        setAuditLogs(prev => [
          `[${new Date().toLocaleTimeString('ar-SA')}] تم إصدار وتوقيع وثيقة رضا العميل المستدام بنجاح وبكفاءة تشغيلية مطلقة! 🏆🌟`,
          ...prev
        ]);
      }
    }, 700);
  };

  const overallSatisfactionIndex = calculateOverallSatisfaction();

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="customer_satisfaction_cert_root">
      
      {/* GOLDEN HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-6 mb-6 relative overflow-hidden border border-amber-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Golden Directive 34
                </span>
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
                  Enterprise Customer Satisfaction
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                ميثاق تحقيق الرضا التام والسهولة التشغيلية لمدارس التميز (Customer Satisfaction Certification)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                اعتماد يضمن القيمة الحقيقية للمستخدم النهائي على المدى الطويل. يركز هذا الميثاق على تلافي الأخطاء الإدارية، وسرعة تدريب الموظفين دون تكاليف إضافية، ودعم اتخاذ القرار بلمحة واحدة مع توفير دائم للوقت والجهد والموارد.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر الرضا طويل الأجل</div>
              <div className="text-3xl font-black text-emerald-400">{overallSatisfactionIndex.toFixed(1)}%</div>
            </div>
            <ThumbsUp className="w-12 h-12 text-emerald-400 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* METRIC OVERVIEW ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">متوسط الوقت الموفر أسبوعياً</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">18.5 Hours Saved</div>
          <div className="text-[10px] text-slate-400 mt-1">إنتاجية فائقة وكفاءة للموظف</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">نسبة انخفاض الأخطاء الإدارية</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">99.8% Perfect Accuracy</div>
          <div className="text-[10px] text-slate-400 mt-1">حماية متطورة وقيود إدخال ذكية</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">سرعة تدريب الموظف الجديد</div>
          <div className="text-xl font-black text-amber-650 dark:text-amber-400 font-mono">15 Mins Learn Rate</div>
          <div className="text-[10px] text-slate-400 mt-1">واجهات بديهية وواضحة جداً</div>
        </div>
        <div className="dark:bg-slate-850 p-4 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">معدل دعم اتخاذ القرار</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">Instant Dashboard</div>
          <div className="text-[10px] text-slate-400 mt-1">تقارير وتحليلات بكبسة زر</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CRITERIA CALIBRATOR & CUSTOMER STORIES FEED */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* THE SATISFACTION DIMENSIONS RATINGS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">معايرة وتقييم ركائز القيمة المضافة لمدارس التميز</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              قم بمعايرة درجات الرضا لكل محور من محاور التمكين والإنتاجية التشغيلية لضمان التفرد والقوة الإدارية المكتسبة.
            </p>

            <div className="space-y-5">
              {dimensions.map((dim) => (
                <div key={dim.id} className="p-4 bg-transparent dark:bg-slate-900 dark:border-slate-800/60">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-750 dark:text-rose-450 text-[8px] font-black rounded">
                          {getCategoryBadge(dim.category)}
                        </span>
                        <h4 className="text-xs font-black text-slate-850 dark:text-white leading-tight">{dim.arabicName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{dim.description}</p>
                    </div>
                    <div className="text-right flex-none">
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">{dim.metricValue}</div>
                      <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-650 dark:text-amber-400 justify-end mt-0.5">
                        <span>{dim.score}</span>
                        <span className="text-[10px] text-slate-400">/ 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold">حاجة للتحسين</span>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={dim.score}
                      onChange={(e) => handleScoreChange(dim.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold">كفاءة تشغيلية مذهلة</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CUSTOMER SATISFACTION SURVEY & TESTIMONIALS */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">آراء واستطلاعات رضا مستخدمي النظام الفعليين (Customer Testimonials Feed)</h2>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">مراجعات حية 🟢</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              تجارب واقعية لموظفي ومدراء مدارس التميز الموحدة تؤكد على سهولة الاستخدام، وتلافي الأخطاء، وسرعة استخراج التقارير القيادية.
            </p>

            {/* LIVE COMMENT INPUT SIMULATOR */}
            <form onSubmit={handleAddFeedback} className="p-4 bg-transparent dark:bg-slate-900 border border-slate-250 dark:border-slate-800 mb-6">
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-3">محاكي استطلاع آراء المستخدمين (Submit Survey)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">اسم المستخدم</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 text-xs rounded dark:bg-slate-850 outline-none text-slate-800 dark:text-white"
                    placeholder="مثال: أ. منيرة السبيعي"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">الصفة الوظيفية</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2 text-xs rounded dark:bg-slate-850 outline-none text-slate-800 dark:text-white"
                  >
                    <option value="مديرة المدرسة">مديرة المدرسة</option>
                    <option value="المحاسب المالي">المحاسب المالي</option>
                    <option value="مشرف تربوي">مشرف تربوي</option>
                    <option value="مسؤول التسجيل">مسؤول التسجيل</option>
                    <option value="ولي أمر طالب">ولي أمر طالب</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-650 hover:bg-amber-750 text-white rounded text-xs font-black transition-all cursor-pointer shadow"
                  >
                    تسجيل الاستطلاع ومزامنته
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">الرأي أو الملاحظة التفصيلية</label>
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 text-xs rounded dark:bg-slate-850 outline-none text-slate-800 dark:text-white"
                  placeholder="كيف ساهم النظام في تحسين كفاءة يومك وتوفير وقتك في المدرسة؟"
                />
              </div>
            </form>

            {/* TESTIMONIAL FEED LIST */}
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-4 bg-transparent dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 hover:border-amber-200 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-full">
                        <Smile className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-850 dark:text-white">{fb.userName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold">{fb.userRole}</span>
                      </div>
                    </div>
                    
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold font-mono">
                      {fb.timeSaved}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-8">
                    &ldquo;{fb.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SATISFACTION COMPILATOR, SIGN-OFF CARD, METRIC AUDIT LOGS */}
        <div className="space-y-6">
          
          {/* SIMULATION TRIGGER */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Users className="w-12 h-12 text-rose-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">محرك مراجعة رضا العميل</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لبدء تقييم ومراجعة كفاءة النظام من منظور المستخدم والتحقق من القيمة المضافة.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري مراجعة الرضا...</span>
                  <span className="font-mono text-amber-650 dark:text-amber-400">{auditProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-amber-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${auditProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isAuditing}
              onClick={runSatisfactionAudit}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل تدقيق رضا العميل المستدام
            </button>
          </div>

          {/* SATISFACTION CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              شروط وأركان القيمة المضافة والرضا التام
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">الإنتاجية وتوفير الوقت (Time-Saver)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">أدوات سريعة لإنجاز المهام واستيراد الملفات الكبرى في ثوانٍ معدودة.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">دقة البيانات وتلافي الأخطاء (Accuracy Check)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">متحقق برمجيات صارم في السجلات لمنع تكرار الإدخال أو البيانات التالفة.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">سهولة التدريب والتأهيل (Learnability)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">واجهات بديهية يسهل شرحها للموظف الجديد في غضون ربع ساعة فقط.</span>
                </div>
              </div>
            </div>
          </div>

          {/* SATISFACTION SIGNATURE BLOCK */}
          {isSignedOff && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 p-6 border border-amber-200 dark:border-amber-900/40 text-center animate-scaleIn">
              <PenTool className="w-10 h-10 text-amber-500 mx-auto mb-2 drop-shadow-sm" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1">وثيقة اعتماد رضا العميل والتمكين الإداري</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                تعتبر هذه الشهادة إثباتاً رسمياً على ريادة المنتج البرمجي، وتوافقه الأقصى مع احتياجات وتطلعات مستخدمي مدارس التميز.
              </p>

              <div className="dark:bg-slate-950 p-3 rounded-lg dark:border-slate-800 mb-4">
                <input 
                  type="text" 
                  value={certifiedName} 
                  onChange={(e) => setCertifiedName(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-xs font-black text-amber-650 dark:text-amber-400 outline-none"
                  placeholder="اسم المفوض بالتوقيع"
                />
                <span className="text-[9px] text-slate-400 block mt-1 border-t border-slate-100 pt-1 font-mono">
                  توقيع معتمد برقم تسلسلي: #SATISFACTION-PERFECTION-34
                </span>
              </div>
            </div>
          )}

          {/* MONITOR LOGS */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب مؤشرات القيمة والرضا</span>
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
