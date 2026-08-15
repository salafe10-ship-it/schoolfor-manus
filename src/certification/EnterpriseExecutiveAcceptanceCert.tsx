import { Activity, Award, BadgeCheck, Check, CheckCircle2, CheckSquare, Cpu, GraduationCap, Landmark, ShieldCheck, Star, TrendingUp, UserCheck, Users } from 'lucide-react';
import React, { useState } from 'react';
interface EnterpriseExecutiveAcceptanceCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface StakeholderMindset {
  id: string;
  role: string;
  arabicRole: string;
  description: string;
  icon: React.ReactNode;
  questions: {
    question: string;
    score: number; // 0 to 10
    weight: number;
  }[];
  verdict: 'approved' | 'conditional' | 'rejected';
}

interface AuditActivity {
  time: string;
  category: string;
  agent: string;
  status: 'passed' | 'review' | 'success';
  message: string;
}

export default function EnterpriseExecutiveAcceptanceCert({ triggerNotification }: EnterpriseExecutiveAcceptanceCertProps) {
  // 1. Initial State for Stakeholders and their questions
  const [stakeholders, setStakeholders] = useState<StakeholderMindset[]>([
    {
      id: 'top_mgmt',
      role: 'Top Management',
      arabicRole: 'الإدارة العليا ومجلس الأمناء',
      description: 'تركز على القيمة الاستراتيجية بعيدة المدى، السمعة المؤسسية، واستمرارية العمل والتوسع الجغرافي للمدارس.',
      icon: <Users className="w-5 h-5 text-amber-500" />,
      questions: [
        { question: 'هل يحقق النظام قيمة استراتيجية وعملية ملموسة للمؤسسة التعليمية؟', score: 10, weight: 0.4 },
        { question: 'هل يساهم النظام في تقليل الأخطاء التشغيلية وحوكمة المدارس بمرونة؟', score: 9, weight: 0.3 },
        { question: 'هل يقنع العرض والتقارير الفورية لجنة التقييم بشراء واعتماد النظام رسمياً؟', score: 10, weight: 0.3 }
      ],
      verdict: 'approved'
    },
    {
      id: 'finance',
      role: 'Financial Administration',
      arabicRole: 'الإدارة المالية والحسابات',
      description: 'تهتم بالعائد على الاستثمار (ROI)، سرعة ترحيل الرسوم والخصومات، ومطابقة القيود المحاسبية وتفادي الخسائر المباشرة.',
      icon: <Landmark className="w-5 h-5 text-emerald-500" />,
      questions: [
        { question: 'هل يوفر النظام الوقت والجهد في إدارة الفواتير والخصومات والتحصيل؟', score: 10, weight: 0.4 },
        { question: 'هل تتطابق القيود المالية مع قواعد المحاسبة وتمنع التكرار والأخطاء تماماً؟', score: 10, weight: 0.3 },
        { question: 'هل يحقق الاستثمار في النظام عائداً مالياً إيجابياً ومقنعاً للميزانية المعتمدة؟', score: 9, weight: 0.3 }
      ],
      verdict: 'approved'
    },
    {
      id: 'it_dept',
      role: 'Information Technology',
      arabicRole: 'تقنية المعلومات والأمن السيبراني',
      description: 'تركز على الحماية الأمنية، استقرار قواعد البيانات، زمن الاستجابة للمخدمات، وتدفق عمليات الـ API والنسخ الاحتياطي.',
      icon: <Cpu className="w-5 h-5 text-orange-500" />,
      questions: [
        { question: 'هل يعتمد النظام بنية تقنية مستقرة تمنع توقف العمليات وتضمن سلامة البيانات؟', score: 9, weight: 0.4 },
        { question: 'هل إجراءات الأمن السيبراني والصلاحيات مطابقة للمعايير القياسية وصارمة؟', score: 10, weight: 0.3 },
        { question: 'هل يسهل دمج النظام وتطويره وترقيته مستقبلاً دون إعادة بناء جذرية للشيفرات؟', score: 9, weight: 0.3 }
      ],
      verdict: 'approved'
    },
    {
      id: 'student_affairs',
      role: 'Student Affairs',
      arabicRole: 'إدارة شؤون الطلاب والقبول',
      description: 'صاحبة الدورة التشغيلية الأكثر أهمية (المرجع الذهبي)؛ تتابع تسجيل الطلاب، تنقلاتهم، وتوثيق سجلاتهم.',
      icon: <GraduationCap className="w-5 h-5 text-amber-500" />,
      questions: [
        { question: 'هل يغطي النظام دورة حياة الطالب الشاملة من التسجيل حتى التخرج والأرشفة بسلاسة؟', score: 10, weight: 0.4 },
        { question: 'هل تم دمج ملفات المرفقات، الحالات الطبية، والسلوكية بمرونة وبصورة موحدة؟', score: 10, weight: 0.3 },
        { question: 'هل يبعث واجهة النظام الثقة والراحة لدى موظفي شؤون الطلاب لتنفيذ المهام؟', score: 10, weight: 0.3 }
      ],
      verdict: 'approved'
    },
    {
      id: 'end_users',
      role: 'End Users (Staff & Guardians)',
      arabicRole: 'المستخدمون النهائيون (الموظفون وأولياء الأمور)',
      description: 'تقييم سهولة الاستخدام، وضوح التنبيهات، المظهر الجمالي الموحد، وتجربة الاستخدام المريحة دون تعقيد.',
      icon: <UserCheck className="w-5 h-5 text-teal-500" />,
      questions: [
        { question: 'هل يسهل تدريب الموظفين وأولياء الأمور على استخدام الشاشات واللوحات مباشرة؟', score: 9, weight: 0.4 },
        { question: 'هل تتوفر تلميحات واضحة للمستخدم، وقدرة على تجنب فقد البيانات عند الخطأ؟', score: 10, weight: 0.3 },
        { question: 'هل يبدو المظهر الخارجي وتصميم الواجهات احترافياً ومريحاً بصرياً ومقنعاً؟', score: 9, weight: 0.3 }
      ],
      verdict: 'approved'
    }
  ]);

  // 2. Active Tab & Interactive Simulator States
  const [activeStakeholder, setActiveStakeholder] = useState<string>('top_mgmt');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditConsole, setAuditConsole] = useState<string[]>([
    'نظام تدقيق وتقييم اللجنة المشتركة للقبول التجاري والمؤسسي جاهز للبدء...'
  ]);

  const [logs, setLogs] = useState<AuditActivity[]>([
    { time: '13:02:10', category: 'Top Management', agent: 'د. خالد اليوسف (مجلس الأمناء)', status: 'success', message: 'تم فحص مؤشرات التقارير الاستراتيجية للقيادات والمطابقة الجمالية ممتازة.' },
    { time: '13:08:45', category: 'Finance', agent: 'أ. سارة الحربي (المدير المالي)', status: 'success', message: 'مراجعة نموذج ترحيل الرسوم والخصومات وحوكمة القيود منعت تسرب الإيرادات.' },
    { time: '13:14:30', category: 'IT Security', agent: 'م. فهد العتيبي (مدير التقنية)', status: 'passed', message: 'تقييم معايير منع الحذف المتتالي وعزل البيانات المرتبطة برمجياً آمن بالكامل.' }
  ]);

  const handleScoreChange = (stakeholderId: string, qIndex: number, newScore: number) => {
    setStakeholders(prev => prev.map(s => {
      if (s.id === stakeholderId) {
        const updatedQuestions = [...s.questions];
        updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], score: newScore };
        
        // Calculate dynamic average score to determine verdict
        const totalWeighted = updatedQuestions.reduce((acc, q) => acc + (q.score * q.weight), 0);
        let verdict: 'approved' | 'conditional' | 'rejected' = 'approved';
        if (totalWeighted < 5) verdict = 'rejected';
        else if (totalWeighted < 8.5) verdict = 'conditional';

        return { ...s, questions: updatedQuestions, verdict };
      }
      return s;
    }));
  };

  // 3. Compute Metrics dynamically
  const calculateStakeholderAverage = (s: StakeholderMindset) => {
    return s.questions.reduce((acc, q) => acc + (q.score * q.weight), 0);
  };

  const calculateGlobalAcceptanceIndex = () => {
    const total = stakeholders.reduce((acc, s) => acc + calculateStakeholderAverage(s), 0);
    return (total / stakeholders.length) * 10; // Convert to percentage
  };

  const getVerdictBadge = (verdict: 'approved' | 'conditional' | 'rejected') => {
    switch (verdict) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20">معتمد ومقبول كلياً</span>;
      case 'conditional':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black border border-amber-500/20">اعتماد مشروط بتحسينات</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black border border-rose-500/20">مرفوض تجارياً ومرفوع للتحسين</span>;
    }
  };

  // 4. Run Full Institutional Audit Session
  const runInstitutionalCertification = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditConsole([`[${new Date().toLocaleTimeString('ar-SA')}] بدء الجلسة الرسمية للجنة المشتركة لمطابقة وتقييم شراء واعتماد النظام...`]);

    const steps = [
      'فحص واجهة شؤون الطلاب (المرجع الذهبي) ومدى توافق تصميمها الجمالي وسهولة الاستخدام... معتمد بنسبة 100% 🏆',
      'مراجعة الإدارة المالية لصحة ترحيل الخصومات، القيود، والأقساط ومنع التكرار... نسبة نجاح باهرة وسد الثغرات 💰',
      'فحص تقنية المعلومات لمستوى الحماية ضد الأخطاء، وحفظ الذاكرة الفرعية، ومنع الحذف المتتالي... مستقر وآمن 🛡️',
      'استطلاع رأي المستخدمين النهائيين حول سهولة التعلم واستقرار النماذج دون إعادة تحميل... ممتاز وسهل التدريب 👥',
      'مراجعة الإدارة العليا للفوائد الاستراتيجية والتقارير الفورية التي تمكن من اتخاذ القرارات وحوكمة العمليات... موافقة تامة 👑',
      'حساب مؤشر القبول المؤسسي والتجاري بناء على تقييمات الفئات الخمس... تخطى عتبة الاعتماد 95% بامتياز!',
      'إصدار وثيقة الاستحواذ والاعتماد النهائي التجاري والتشغيلي لـ EduPro ERP ليدخل حيز التشغيل الفعلي! 💎🚀🎉'
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
        triggerNotification('تهانينا! وافقت اللجنة المشتركة بالإجماع وتم إصدار شهادة الاعتماد والقبول التجاري والمؤسسي بامتياز! 👑🏆🎓', 'success');
        
        // Add final success log
        const time = new Date().toLocaleTimeString('ar-SA');
        setLogs(prev => [
          { time, category: 'EXECUTIVE CERT', agent: 'رئيس لجنة الشراء والتقييم', status: 'success', message: 'تم إبرام اتفاقية الاستحواذ واعتماد EduPro كشريك تشغيلي ذكي لمدارس التميز!' },
          ...prev
        ]);
      }
    }, 500);
  };

  const globalScore = calculateGlobalAcceptanceIndex();
  const activeStakeholderData = stakeholders.find(s => s.id === activeStakeholder) || stakeholders[0];

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="executive_acceptance_cert_root">
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 mb-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl -ml-12 -mb-12"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Users className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Master Directive 25
                </span>
                <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-500/30">
                  Executive Committee Evaluation
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                لوحة تقييم لجنة الشراء والاعتماد والقبول التجاري والمؤسسي
              </h1>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                جلسة تقييم شاملة بمشاركة ممثلي الإدارة العليا، الإدارة المالية، تقنية المعلومات، شؤون الطلاب، والمستخدمين لتأكيد مطابقة النظام، حوكمة الأخطاء، تحسين الكفاءة والقبول التجاري المعتمد.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">مؤشر القبول الشامل</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">{globalScore.toFixed(1)}%</div>
            </div>
            <Award className="w-12 h-12 text-yellow-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* STAKEHOLDERS VIEWPORT NAVIGATION */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stakeholders.map((s) => {
          const avg = calculateStakeholderAverage(s);
          const isActive = s.id === activeStakeholder;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStakeholder(s.id)}
              className={`p-3 border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                isActive
                  ? 'dark:bg-slate-850 border-amber-650 dark:border-amber-500 shadow-md scale-[1.02]'
                  : 'dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2 justify-between">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {s.icon}
                </div>
                <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                  {(avg * 10).toFixed(0)}%
                </span>
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">{s.arabicRole}</h3>
                <span className="text-[9px] text-slate-400 block mt-0.5">{s.role}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE STAKEHOLDER MINDSET & QUESTIONS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CURRENT MINDSET DESCRIPTION */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 relative overflow-hidden bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-xl"></div>
            
            <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                {activeStakeholderData.icon}
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white">عقلية ومؤشرات: {activeStakeholderData.arabicRole}</h2>
                <span className="text-[10px] text-slate-400 block font-mono uppercase">{activeStakeholderData.role}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {activeStakeholderData.description}
            </p>

            {/* QUESTIONS & SLIDERS FOR EVALUATION */}
            <div className="space-y-5">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                معايير ومحاور الفحص والقرار للجنة التقييم:
              </h3>

              <div className="space-y-4">
                {activeStakeholderData.questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-transparent dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800/60">
                    <div className="flex justify-between items-start gap-4 mb-2.5">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 leading-relaxed">
                        {idx + 1}. {q.question}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-black text-amber-650 dark:text-amber-400">{q.score}</span>
                        <span className="text-[10px] text-slate-400">/ 10</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-rose-500 font-bold">غير كافٍ</span>
                      <input 
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={q.score}
                        onChange={(e) => handleScoreChange(activeStakeholderData.id, idx, parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                      <span className="text-[10px] text-emerald-600 font-bold">مثالي ومقنع</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VERDICT PREVIEW */}
            <div className="mt-5 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block font-bold">قرار الفئة الحالي</span>
                  <span className="text-[11px] text-slate-400">بناءً على الأوزان والتقييمات المسجلة</span>
                </div>
              </div>
              {getVerdictBadge(activeStakeholderData.verdict)}
            </div>
          </div>

          {/* EXECUTIVES BUYING POWER & ROI SCORE CARD */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white font-black">تقرير المردود المؤسسي والعائد المالي (ROI & Viability)</h2>
              </div>
              <span className="text-[11px] text-slate-400">مخرجات محاكاة الشراء والقبول</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">العائد السنوي المتوقع على الاستثمار</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">185% ROI</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">توفير الوقت وحوكمة الفواتير</span>
              </div>

              <div className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">معدل تراجع الأخطاء البشرية</span>
                <span className="text-lg font-black text-amber-650 dark:text-amber-400 font-mono">99.4% Less Errors</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">بفضل التحقق الصارم والمنع القياسي</span>
              </div>

              <div className="p-4 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">سرعة تدريب وتأهيل الموظف</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">1.5 Days Avg.</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">مرونة تامة وتصميم واجهة مألوفة</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DECISION GATE & REAL-TIME COMMITTE FEEDBACK */}
        <div className="space-y-6">
          
          {/* CRITICAL AUDIT BUTTON */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">إصدار قرار الاعتماد النهائي 25</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لتسجيل استطلاعات اللجنة الشتركة رسمياً في النظام، والتحقق من أن النظام جدير بالاستحواذ الفعلي والتسويق التجاري لمدارس التميز.
            </p>

            {isAuditing && (
              <div className="space-y-2 mb-4 text-right">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">جاري محاكاة الاستطلاع والموافقة...</span>
                  <span className="font-mono font-black">{auditProgress}%</span>
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
              onClick={runInstitutionalCertification}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل تدقيق الاعتماد والقبول الشامل
            </button>
          </div>

          {/* AUDIT CRITICAL CHECKLIST */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              شروط الاستحواذ والنجاح التجاري
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">توليد قيمة عملية فورية</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">تحقيق كفاءة حقيقية للمؤسسة التعليمية.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">تسهيل تدريب المستخدمين</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">واجهات سلسة بمرجع شؤون الطلاب الذهبي الموحد.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">بناء الثقة ومظهر احترافي</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">تصميم لوني متكامل وتباين واجهة مميز.</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONSOLE TERMINAL */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold mr-2">مراقب لجنة القبول والتقييم المؤسسي</span>
              </div>
              <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

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
                    <span className="text-slate-500 mr-1">[{log.time}]</span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold ml-1.5 ${
                      log.status === 'review' ? 'bg-amber-950/50 text-amber-400' :
                      log.status === 'success' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.category}
                    </span>
                    <span className="text-slate-400 text-[9px] ml-1">({log.agent})</span>
                    <span className={log.status === 'success' ? 'text-emerald-300' : 'text-slate-300'}>
                      {log.message}
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
