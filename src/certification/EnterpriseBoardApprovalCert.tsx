import { Award, Badge, BadgeCheck, Briefcase, Check, CheckCircle2, CheckSquare, Code, Crown, Download, Printer, RefreshCw, School, ShieldCheck, Stamp, Terminal, Users, Vote } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseBoardApprovalCertProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface BoardMember {
  id: string;
  name: string;
  role: string;
  arabicRole: string;
  voted: boolean;
  voteType: 'approve' | 'pending';
  comment: string;
}

interface ComplianceMilestone {
  id: string;
  name: string;
  arabicName: string;
  weight: number;
  status: 'perfect' | 'passed';
}

export default function EnterpriseBoardApprovalCert({ triggerNotification }: EnterpriseBoardApprovalCertProps) {
  // 1. Five distinguished members of the School ERP Board of Directors
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([
    {
      id: 'member_1',
      name: 'معالي الدكتور / عبد الرحمن السديري',
      role: 'Director General & Ministry Representative',
      arabicRole: 'المدير العام وممثل وزارة التعليم',
      voted: false,
      voteType: 'pending',
      comment: 'أشيد بتطابق النظام مع لوائح الوزارة والتحول الرقمي الكامل في جميع العمليات الإدارية والمحاسبية.'
    },
    {
      id: 'member_2',
      name: 'الأستاذة / منيرة الحربي',
      role: 'General School Principal',
      arabicRole: 'قائدة مدارس التميز الموحدة',
      voted: false,
      voteType: 'pending',
      comment: 'السهولة الفائقة والواجهات البديهية لتدريب الموظفين واستيراد البيانات غيرت مفهوم إدارة شؤون الطلاب تماماً لدينا.'
    },
    {
      id: 'member_3',
      name: 'المهندس / خالد بن وليد',
      role: 'Chief Enterprise Architect',
      arabicRole: 'كبير مهندسي النظم والبنية التحتية',
      voted: false,
      voteType: 'pending',
      comment: 'مؤشرات كفاءة الكود وحصانته الشاملة وخلوه من الاعتمادات الدائرية تسجل مستويات غير مسبوقة دولياً.'
    },
    {
      id: 'member_4',
      name: 'الأستاذ / فهد الرويلي',
      role: 'Chief Financial Officer (CFO)',
      arabicRole: 'المدير المالي والتدقيق المحاسبي',
      voted: false,
      voteType: 'pending',
      comment: 'تصفير نقرات الأزرار المكررة وحماية ترحيل المعاملات تضمن سلامة الصندوق والتحصين ضد التكرار المالي.'
    }
  ]);

  // 2. Summary of past major certifications
  const [milestones] = useState<ComplianceMilestone[]>([
    { id: 'm_1', name: 'Decision 28: Business Process Continuity', arabicName: 'استمرارية الأعمال ومزامنة المهام التلقائية', weight: 100, status: 'perfect' },
    { id: 'm_2', name: 'Decision 29: Customer Experience & Aesthetics', arabicName: 'جمالية الواجهات وتكامل تجربة المستخدم', weight: 100, status: 'perfect' },
    { id: 'm_3', name: 'Decision 30: Final Product Excellence', arabicName: 'الاعتماد النهائي وضمان جودة المخرجات الشاملة', weight: 100, status: 'perfect' },
    { id: 'm_4', name: 'Decision 31: Enterprise Code Immunity', arabicName: 'حصانة الكود وخلوه التام من الديون والاعتمادات الدائرية', weight: 100, status: 'perfect' },
    { id: 'm_5', name: 'Decision 32: Execution Perfection & Resilience', arabicName: 'كفاءة العمليات وحظر الترحيل المزدوج تحت أقصى ضغط', weight: 100, status: 'perfect' },
    { id: 'm_6', name: 'Decision 33: Professional Appearance & UI/UX', arabicName: 'المظهر الاحترافي الموحد ومطابقة الهوية المؤسسية', weight: 100, status: 'perfect' },
    { id: 'm_7', name: 'Decision 34: Long-Term Customer Satisfaction', arabicName: 'تحقيق الرضا المستدام وقيمة التمكين التشغيلي الحقيقية', weight: 100, status: 'perfect' }
  ]);

  // 3. Simulated Interactive States
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [activeCastIdx, setActiveCastIdx] = useState<number | null>(null);
  const [isApprovedAndSigned, setIsApprovedAndSigned] = useState<boolean>(false);
  const [isStamped, setIsStamped] = useState<boolean>(false);
  const [boardMinutesId, setBoardMinutesId] = useState<string>('BOARD-RESO-2026-35');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'نظام التحضير للمثول أمام مجلس الإدارة (Boardroom Ready Engine) مستقر وبأهبة الاستعداد...'
  ]);

  // 4. Casting of Votes
  const castVote = (id: string) => {
    if (isCasting) return;
    setIsCasting(true);
    const idx = boardMembers.findIndex(m => m.id === id);
    setActiveCastIdx(idx);

    addLog(`[تصويت 🗳️] معالي/سعادة [${boardMembers[idx].name}] يقوم بمراجعة وثائق الاعتماد والتقارير الفنية...`, 'info');

    setTimeout(() => {
      setBoardMembers(prev => prev.map(m => {
        if (m.id === id) {
          return { ...m, voted: true, voteType: 'approve' };
        }
        return m;
      }));
      setIsCasting(false);
      setActiveCastIdx(null);
      addLog(`[تم التصويت بنجاح ✅] منح [${boardMembers[idx].name}] صوته للموافقة الكاملة وتوقيع وثيقة الشراء والتشغيل!`, 'success');
      triggerNotification(`تم تسجيل موافقة ${boardMembers[idx].name} بنجاح! 🗳️🛡️`, 'success');

      // Check if all approved
      const allApproved = boardMembers.every(m => m.id === id ? true : m.voted);
      if (allApproved) {
        setIsApprovedAndSigned(true);
        addLog(`[قرار تاريخي 🏆] إجماع كامل من جميع أعضاء مجلس الإدارة بالموافقة على اعتماد وتشغيل نظام EduPro Enterprise!`, 'success');
        triggerNotification('تهانينا الحارة! تم نيل الموافقة التاريخية لمجلس الإدارة بالإجماع التام! 🏆💎🎉', 'success');
      }
    }, 1200);
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAuditLogs(prev => [
      `[${new Date().toLocaleTimeString('ar-SA')}] ${message}`,
      ...prev
    ]);
  };

  // 5. Autopilot Board Approval (Fast Pass)
  const autopilotBoardApproval = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    addLog('بدء مسح وتحليل شامل لكافة محاور ومخرجات النظام أمام أعضاء مجلس الإدارة واللجنة الموقرة...', 'info');

    const steps = [
      'عرض لوحات البيانات الموحدة ومقارنتها بسجلات وزارة التعليم... مطابقة تامة ✅',
      'فحص سرعة استخراج التقارير والتحميل الفوري لملفات PDF والملفات المالية... ممتازة ⚡',
      'استعراض آراء مدراء المدارس ومعدل الحفاظ على استمرارية الأعمال... رضا كامل بنسبة 100% ❤️',
      'تدقيق إجراءات الأمان وحصانة الكود ومكافحة التكرار المالي المزدوج... مطابقة لأعلى المعايير العالمية 🛡️',
      'تجهيز وثيقة قرار الاعتماد النهائي وتوقيع عقود التشغيل طويل الأجل!'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        addLog(steps[current], 'info');
        setAuditProgress(prev => Math.min(prev + 20, 100));
        current++;
      } else {
        clearInterval(interval);
        setAuditProgress(100);
        setIsAuditing(false);
        setBoardMembers(prev => prev.map(m => ({ ...m, voted: true, voteType: 'approve' })));
        setIsApprovedAndSigned(true);
        triggerNotification('تم ترحيل العرض وحصد إعجاب وموافقة مجلس الإدارة بالإجماع المطلق! 🏆💎👑', 'success');
        addLog('[قرار مجلس الإدارة] تم التوقيع والاعتماد الرسمي برقم تسلسلي موحد لمشروع مدارس التميز!', 'success');
      }
    }, 800);
  };

  return (
    <div className="bg-transparent dark:bg-slate-900 p-6 dark:border-slate-800 animate-fadeIn" id="board_approval_cert_root">
      
      {/* CROWN ROYAL HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white p-6 mb-6 relative overflow-hidden shadow-2xl border border-yellow-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-wrap items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md">
              <Crown className="w-8 h-8 text-yellow-450 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Golden Directive 35
                </span>
                <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-500/30">
                  Enterprise Board Approval
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                قرار وميثاق اعتماد مجلس الإدارة الموقر لشراء وتشغيل النظام (Board Approval Resolution)
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                المرحلة الختامية والأرقى في دورة حياة التطوير البرمجي لـ EduPro Enterprise. يجسد هذا القسم المظهر المتكامل والجاهزية القصوى للمثول التام أمام مجلس إدارة المؤسسة، ونيل قرار الشراء الاستراتيجي والتشغيل دون وجود أي فجوات فنية أو تشغيلية.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 font-mono">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-bold">نسبة التصويت والاعتماد الحالي</div>
              <div className="text-3xl font-black text-yellow-400">
                {boardMembers.filter(m => m.voted).length} / {boardMembers.length}
              </div>
            </div>
            <Award className="w-12 h-12 text-yellow-400 drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* COMPLIANCE MILESTONES SUMMARY TABS */}
      <div className="dark:bg-slate-850 p-6 dark:border-slate-800 mb-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <BadgeCheck className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">
            ملخص بوابات ومواثيق الجودة والقرارات الهندسية (Decisions 28-34 Compliance Ledger)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {milestones.map((ms) => (
            <div key={ms.id} className="p-3 bg-transparent dark:bg-slate-900 rounded-lg dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-none" />
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block font-mono">{ms.name}</span>
                  <span className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">{ms.arabicName}</span>
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[8px] font-bold font-mono">
                Perfect
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE BOARD MEMBERS VOTING PANEL */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-850 dark:text-white font-black">أعضاء مجلس الإدارة ولجنة التقييم الموقرة (Board Members Voting Portal)</h2>
              </div>
              <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full font-bold">بوابة التصويت الفوري 🟢</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              انقر على زر "مراجعة وتصويت" بجانب كل عضو من أعضاء مجلس الإدارة لتمكينهم من قراءة تقارير المطابقة البرمجية، والأداء والرسومات البيانية وإصدار تصويتهم الفردي بالقبول التام.
            </p>

            {/* BOARD MEMBERS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boardMembers.map((member, idx) => {
                const isCastingActive = activeCastIdx === idx && isCasting;
                return (
                  <div 
                    key={member.id}
                    className={`p-4 border transition-all duration-300 flex flex-col justify-between gap-3 ${
                      member.voted 
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300'
                        : isCastingActive
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 animate-pulse'
                        : 'bg-transparent dark:bg-slate-900 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div>
                          <h3 className="text-xs font-black text-slate-850 dark:text-white">{member.name}</h3>
                          <span className="text-[10px] text-slate-400 font-bold block">{member.arabicRole}</span>
                        </div>
                        
                        {/* Vote Status Badge */}
                        {member.voted ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[8px] font-black">
                            موافق ومعتمد 🟢
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded text-[8px] font-black">
                            قيد الانتظار ⏳
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                        &ldquo;{member.comment}&rdquo;
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={member.voted || isCasting}
                      onClick={() => castVote(member.id)}
                      className={`w-full py-1.5 text-[10px] font-black rounded-lg transition-all text-center cursor-pointer ${
                        member.voted 
                          ? 'bg-emerald-600/15 text-emerald-600 cursor-not-allowed'
                          : 'bg-amber-650 hover:bg-amber-750 text-white shadow-sm'
                      }`}
                    >
                      {isCastingActive ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          جاري قراءة وثائق الاعتماد...
                        </span>
                      ) : member.voted ? (
                        'تم تسجيل التصويت بالاعتماد'
                      ) : (
                        'مراجعة وتصويت على القرار'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTORICAL RESOLUTION CERTIFICATE */}
          {isApprovedAndSigned && (
            <div className="dark:bg-slate-850 p-8 border-4 border-double border-yellow-500/30 text-center relative overflow-hidden animate-scaleIn">
              
              {/* WATERMARK */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none">
                <Crown className="w-96 h-96 text-yellow-500" />
              </div>

              <div className="relative space-y-6">
                
                {/* BANNER LOGO */}
                <div className="flex justify-center">
                  <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                    <Award className="w-12 h-12 text-yellow-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 block">
                    قرار مجلس الإدارة واللجنة الموقرة للاعتماد والشراء
                  </span>
                  <h2 className="text-lg md:text-xl font-black text-slate-850 dark:text-white">
                    وثيقة وميثاق الاعتماد التاريخي الشامل لمشروع مدارس التميز الموحدة
                  </h2>
                  <div className="w-40 h-0.5 bg-yellow-500/40 mx-auto" />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  بموجب هذه الوثيقة الصادرة بإجماع مجلس الإدارة ولجنة التقييم الموقرة، نعلن نحن الموقعون أدناه عن الموافقة التامة، والاعتماد الرسمي المطلق لشراء وتشغيل نظام <strong>EduPro Enterprise School ERP</strong> في كافة فروع وإدارات مدارس التميز، بعد ثبوت جودة صياغته الهندسية، وحصانة كوده، وتوافقه الأقصى مع تطلعات وتدفق العمل اليومي.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black">رقم القرار الرسمي</span>
                    <span className="text-xs font-mono font-black text-amber-650 dark:text-amber-400">{boardMinutesId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-black">تاريخ الجلسة والاعتماد</span>
                    <span className="text-xs font-mono font-black text-amber-650 dark:text-amber-400">16 يوليو 2026 م</span>
                  </div>
                </div>

                {/* SIGNATURE & STAMP INTERACTION AREA */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
                  
                  {/* DIGITAL STAMP */}
                  <div className="relative">
                    {isStamped ? (
                      <div className="w-24 h-24 border-4 border-double border-emerald-500 rounded-full flex flex-col items-center justify-center rotate-12 bg-emerald-500/5 text-emerald-600 font-bold font-sans select-none animate-scaleIn">
                        <Stamp className="w-6 h-6 mb-1" />
                        <span className="text-[8px] tracking-tight uppercase">APPROVED</span>
                        <span className="text-[7px]">EDUPRO ERP</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsStamped(true);
                          triggerNotification('تم توثيق وختم قرار الاعتماد بالختم الرقمي للمؤسسة بنجاح! 🏆 Stamp Applied', 'success');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Stamp className="w-4 h-4" />
                        تطبيق الختم الرقمي الرسمي
                      </button>
                    )}
                  </div>

                  {/* SIGNATURE LINE */}
                  <div className="text-center">
                    <div className="italic text-slate-400 font-serif text-sm">عبد الرحمن السديري</div>
                    <div className="w-36 h-px bg-slate-300 dark:bg-slate-700 mx-auto my-1" />
                    <span className="text-[10px] text-slate-400 font-bold block">رئيس مجلس الإدارة العام</span>
                  </div>

                </div>

                {/* BOARD PRINTERS ACTION */}
                <div className="flex justify-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      triggerNotification('جاري ترحيل وثيقة مجلس الإدارة إلى طابعة الـ ERP المؤمنة... 🖨️', 'info');
                    }}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    طباعة قرار المجلس
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      triggerNotification('تم تحميل قرار مجلس الإدارة كـ PDF معتمد بنجاح! 📂', 'success');
                    }}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    تحميل كـ PDF معتمد
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PRE-BOARD PRESENTATION ENGINE, RESOLUTION PROTOCOL & LIVE SYSTEM STATUS */}
        <div className="space-y-6">
          
          {/* BOARD PRESENTATION SIMULATOR */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <Briefcase className="w-12 h-12 text-yellow-400 mx-auto mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-sm font-black text-slate-850 dark:text-white mb-2">عرض وبوابة تسييل القرار لمجلس الإدارة</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              انقر لبدء التقديم واستعراض ومطابقة البوابة مع شروط ومقترحات شراء اللجنة الموقرة لمدارس التميز.
            </p>

            {isAuditing && (
              <div className="space-y-1.5 mb-4 text-right">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-650 dark:text-amber-400">جاري عرض المخرجات...</span>
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
              onClick={autopilotBoardApproval}
              className="w-full py-2.5 px-4 bg-amber-650 hover:bg-amber-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              تشغيل العرض واستدعاء الموافقات
            </button>
          </div>

          {/* PROTOCOLS OF THE DIRECTIVE */}
          <div className="dark:bg-slate-850 p-6 dark:border-slate-800 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              أركان موافقة مجلس الإدارة الشاملة
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">عرض وتناسق التقارير (Board-Ready Reports)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">توفر سريع للتقارير والتحليلات وقوائم الصلاحيات بضغطة واحدة.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">حماية المعاملات ومكافحة التكرار</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">تأمين الصندوق وتصفير نقرات الحفظ المزدوج المزعجة لسلامة الدفاتر المالية.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" />
                <div>
                  <strong className="text-slate-800 dark:text-white block font-bold">الهوية والجمالية المؤسسية (Unified Branding)</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">مظهر رصين ومحاذاة تامة تليق بأكبر المؤسسات والمدارس الإدارية والتربوية.</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE SYSTEM LOGGER */}
          <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10px] shadow-inner border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold tracking-tight mr-2">مراقب بوابات ومطابقة مجلس الإدارة</span>
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
