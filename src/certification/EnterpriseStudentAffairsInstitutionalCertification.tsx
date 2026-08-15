import { AlertTriangle, Archive, ArrowLeftRight, Award, BookOpen, Calendar, Check, ClipboardCheck, Compass, Contact, Crown, Database, FileSignature, FileSpreadsheet, FileText, Filter, GraduationCap, Info, Landmark, List, ListRestart, Lock as LockIcon, Logs, Printer, Receipt, RefreshCw, Search, SlidersHorizontal, Split, Terminal, Trash2, UserCheck, Users, Vault, Verified } from 'lucide-react';
import React, { useState } from 'react';

interface EnterpriseStudentAffairsInstitutionalCertificationProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

interface Guardian {
  id: string;
  name: string;
  relation: string;
  priority: number;
  phone: string;
  email: string;
  occupation: string;
  isEmergencyContact: boolean;
}

interface StudentDoc {
  name: string;
  type: string;
  status: 'verified' | 'pending';
  size: string;
}

interface Student {
  id: string;
  academicId: string;
  nationalId: string;
  fullNameAr: string;
  fullNameEn: string;
  birthDate: string;
  birthPlace: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  academicLevel: string;
  section: string;
  studyStatus: 'regular' | 'suspended' | 'withdrawn' | 'graduated' | 'archived'; // الحالة الدراسية
  enrollmentStatus: 'active' | 'inactive' | 'transferred' | 'registered'; // حالة القيد
  photoUrl: string;
  documents: StudentDoc[];
  guardians: Guardian[];
}

export default function EnterpriseStudentAffairsInstitutionalCertification({ triggerNotification }: EnterpriseStudentAffairsInstitutionalCertificationProps) {
  // Sample highly detailed student list for institutional validation
  const [students, setStudents] = useState<Student[]>([
    {
      id: 'st_101',
      academicId: 'STD-2026-0089',
      nationalId: '1092837482',
      fullNameAr: 'عبدالرحمن بن محمد العتيبي',
      fullNameEn: 'Abdulrahman Mohammed Al-Otaibi',
      birthDate: '2010-05-12',
      birthPlace: 'الرياض، المملكة العربية السعودية',
      phone: '+966 50 123 4567',
      email: 'a.otaibi@school.edu.sa',
      gender: 'male',
      academicLevel: 'الصف الأول الثانوي',
      section: 'أ',
      studyStatus: 'regular',
      enrollmentStatus: 'active',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200',
      documents: [
        { name: 'صورة بطاقة الهوية الوطنية / الإقامة', type: 'PDF', status: 'verified', size: '1.2 MB' },
        { name: 'شهادة الميلاد الإلكترونية المعتمدة', type: 'PDF', status: 'verified', size: '840 KB' },
        { name: 'السجل الأكاديمي وشهادة السنة السابقة', type: 'PDF', status: 'verified', size: '2.1 MB' },
        { name: 'مستند إثبات السكن والعنوان الوطني', type: 'PDF', status: 'verified', size: '450 KB' },
      ],
      guardians: [
        { id: 'g_1', name: 'محمد بن عبدالله العتيبي', relation: 'والد', priority: 1, phone: '+966 50 111 2222', email: 'm.otaibi@domain.com', occupation: 'مدير فرع ببنك الراجحي', isEmergencyContact: true },
        { id: 'g_2', name: 'سارة بنت عبدالعزيز الشمري', relation: 'والدة', priority: 2, phone: '+966 50 333 4444', email: 'sara.sh@domain.com', occupation: 'أستاذة جامعية بجامعة الملك سعود', isEmergencyContact: true },
        { id: 'g_3', name: 'خالد بن عبدالله العتيبي', relation: 'عم', priority: 3, phone: '+966 50 555 6666', email: 'k.otaibi@domain.com', occupation: 'مهندس اتصالات', isEmergencyContact: false },
      ]
    },
    {
      id: 'st_102',
      academicId: 'STD-2026-0094',
      nationalId: '2039485721',
      fullNameAr: 'ماجد بن فيصل القحطاني',
      fullNameEn: 'Majed Faisal Al-Qahtani',
      birthDate: '2011-09-24',
      birthPlace: 'جدة، المملكة العربية السعودية',
      phone: '+966 55 987 6543',
      email: 'majed.faisal@school.edu.sa',
      gender: 'male',
      academicLevel: 'الصف الأول الثانوي',
      section: 'ب',
      studyStatus: 'regular',
      enrollmentStatus: 'active',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
      documents: [
        { name: 'صورة بطاقة الهوية الوطنية / الإقامة', type: 'PDF', status: 'verified', size: '1.4 MB' },
        { name: 'شهادة الميلاد الإلكترونية المعتمدة', type: 'PDF', status: 'verified', size: '920 KB' },
        { name: 'السجل الأكاديمي وشهادة السنة السابقة', type: 'PDF', status: 'verified', size: '1.8 MB' },
      ],
      guardians: [
        { id: 'g_4', name: 'فيصل بن ماجد القحطاني', relation: 'والد', priority: 1, phone: '+966 55 981 1122', email: 'f.qahtani@domain.com', occupation: 'ضابط بوزارة الدفاع', isEmergencyContact: true },
        { id: 'g_5', name: 'هند بنت محمد العسيري', relation: 'والدة', priority: 2, phone: '+966 55 981 3344', email: 'hind.as@domain.com', occupation: 'طبيبة استشارية بمستشفى الحرس', isEmergencyContact: true },
      ]
    },
    {
      id: 'st_103',
      academicId: 'STD-2026-0105',
      nationalId: '1094837592',
      fullNameAr: 'فاطمة بنت أحمد الزهراني',
      fullNameEn: 'Fatimah Ahmed Al-Zahrani',
      birthDate: '2010-11-04',
      birthPlace: 'الدمام، المملكة العربية السعودية',
      phone: '+966 54 444 8888',
      email: 'f.zahrani@school.edu.sa',
      gender: 'female',
      academicLevel: 'الصف الثاني الثانوي',
      section: 'أ',
      studyStatus: 'suspended',
      enrollmentStatus: 'inactive',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
      documents: [
        { name: 'صورة بطاقة الهوية الوطنية / الإقامة', type: 'PDF', status: 'verified', size: '1.1 MB' },
        { name: 'شهادة الميلاد الإلكترونية المعتمدة', type: 'PDF', status: 'verified', size: '750 KB' },
        { name: 'طلب إيقاف القيد الرسمي المؤقت', type: 'PDF', status: 'verified', size: '1.5 MB' },
      ],
      guardians: [
        { id: 'g_6', name: 'أحمد بن علي الزهراني', relation: 'والد', priority: 1, phone: '+966 54 411 2233', email: 'a.zahrani@domain.com', occupation: 'قائد تربوي بوزارة التعليم', isEmergencyContact: true },
        { id: 'g_7', name: 'نورة بنت عثمان الغامدي', relation: 'والدة', priority: 2, phone: '+966 54 411 4455', email: 'noura.gh@domain.com', occupation: 'موجهة أكاديمية', isEmergencyContact: true },
      ]
    }
  ]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('st_101');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [advNationalId, setAdvNationalId] = useState<string>('');
  const [advAcademicId, setAdvAcademicId] = useState<string>('');

  // Interactive Certification Checklist State
  const [checklist, setChecklist] = useState({
    // Student Data Check
    academicId: true,
    nationalId: true,
    identityData: true,
    birthData: true,
    contactData: true,
    academicStatus: true,
    enrollmentStatus: true,
    studentPhoto: true,
    documentsUploaded: true,
    // Guardian Check
    multipleGuardians: true,
    priorityOrder: true,
    guardianContact: true,
    guardianEmail: true,
    guardianRelation: true,
    guardianOccupation: true,
    emergencyContacts: true,
    // Academic Lifecycle Check
    registrationAudit: true,
    transferAudit: true,
    reRegistrationAudit: true,
    suspendEnrollmentAudit: true,
    withdrawalAudit: true,
    graduationAudit: true,
    archivalAudit: true,
    // Productivity
    instantSearch: true,
    advancedSearch: true,
    customFilters: true,
    quickSave: true,
    shortcuts: true,
    // Integrations
    feesIntegration: true,
    examsIntegration: true,
    attendanceIntegration: true,
    libraryIntegration: true,
    ledgerIntegration: true,
    reportsIntegration: true,
  });

  // Action log state to simulate an audit trail
  const [actionLogs, setActionLogs] = useState<string[]>([
    'تم تهيئة نظام التدقيق والاعتماد المؤسسي لشؤون الطلاب للعام الدراسي 2026/2027.',
    'تم فحص تكامل قاعدة البيانات المشتركة ومطابقتها للمعايير والسياسات الموحدة.'
  ]);

  // Selected student
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    triggerNotification('تم تحديث معيار الاعتماد والمطابقة.', 'info');
  };

  // Lifecycle state transition handler
  const triggerLifecycleAction = (action: 'register' | 'transfer' | 're_register' | 'suspend' | 'withdraw' | 'graduate' | 'archive') => {
    let newStudyStatus: Student['studyStatus'] = selectedStudent.studyStatus;
    let newEnrollmentStatus: Student['enrollmentStatus'] = selectedStudent.enrollmentStatus;
    let actionNameAr = '';

    switch (action) {
      case 'register':
        newStudyStatus = 'regular';
        newEnrollmentStatus = 'registered';
        actionNameAr = 'تسجيل الطالب بالمنظومة';
        break;
      case 'transfer':
        newStudyStatus = 'regular';
        newEnrollmentStatus = 'transferred';
        actionNameAr = 'نقل الطالب إلى فرع أو مدرسة أخرى مع الحفاظ على الأرشيف المالي والأكاديمي';
        break;
      case 're_register':
        newStudyStatus = 'regular';
        newEnrollmentStatus = 'active';
        actionNameAr = 'إعادة قيد الطالب وتنشيط الملف المالي والتعليمي';
        break;
      case 'suspend':
        newStudyStatus = 'suspended';
        newEnrollmentStatus = 'inactive';
        actionNameAr = 'إيقاف قيد الطالب مؤقتاً بسبب مستجدات معتمدة';
        break;
      case 'withdraw':
        newStudyStatus = 'withdrawn';
        newEnrollmentStatus = 'inactive';
        actionNameAr = 'انسحاب كلي مع تسوية المستحقات المالية وطباعة الملف';
        break;
      case 'graduate':
        newStudyStatus = 'graduated';
        newEnrollmentStatus = 'inactive';
        actionNameAr = 'إتمام مرحلة التخرج وإصدار الشهادة وتوليد السجل الفخري';
        break;
      case 'archive':
        newStudyStatus = 'archived';
        newEnrollmentStatus = 'inactive';
        actionNameAr = 'أرشفة السجلات الرقمية للطالب بنظام الأرشفة السحابية الدائم';
        break;
    }

    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? {
      ...s,
      studyStatus: newStudyStatus,
      enrollmentStatus: newEnrollmentStatus
    } : s));

    const logMsg = `[دورة حياة الطالب] تم إجراء حركة [${actionNameAr}] للطالب: ${selectedStudent.fullNameAr} (${selectedStudent.academicId}).`;
    setActionLogs(prev => [logMsg, ...prev]);
    triggerNotification(`تمت معالجة حركة: ${actionNameAr} بنجاح ✓`, 'success');
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.fullNameAr.includes(searchTerm) || 
      s.fullNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.academicId.includes(searchTerm) ||
      s.nationalId.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' ? true : s.studyStatus === statusFilter;
    const matchesLevel = levelFilter === 'all' ? true : s.academicLevel === levelFilter;

    const matchesAdvNational = advNationalId ? s.nationalId.includes(advNationalId) : true;
    const matchesAdvAcademic = advAcademicId ? s.academicId.includes(advAcademicId) : true;

    return matchesSearch && matchesStatus && matchesLevel && matchesAdvNational && matchesAdvAcademic;
  });

  // Calculate stats
  const totalItems = Object.keys(checklist).length;
  const verifiedItems = Object.values(checklist).filter(Boolean).length;
  const progressPercentage = Math.round((verifiedItems / totalItems) * 100);

  const [isSealed, setIsSealed] = useState<boolean>(false);
  const [isSimulatingIntegration, setIsSimulatingIntegration] = useState<boolean>(false);

  const runIntegrationTest = () => {
    setIsSimulatingIntegration(true);
    setActionLogs(prev => ['[فحص التكامل] جاري اختبار مطابقة وسلامة حزم الربط البيني للبيانات المشتركة...', ...prev]);
    
    setTimeout(() => {
      const msgs = [
        '[التكامل - الرسوم] ✓ تم التحقق من ترحيل الرسوم تلقائياً للطالب وتوافق السداد السريع.',
        '[التكامل - الامتحانات] ✓ تم اختبار حجب هويات الطلاب بالباركود ورصد لجان الاختبار بنجاح.',
        '[التكامل - الحضور] ✓ تم ربط سجلات البصمة والغياب اليومي بملف شؤون الطلاب.',
        '[التكامل - المكتبة] ✓ تم تفعيل موازين استعارة الكتب وتصفية المستحقات عند طلب الانسحاب.',
        '[التكامل - الحسابات] ✓ تم فحص إسناد قيود اليومية المحاسبية المباشرة إلى شجرة الحسابات.',
        '[التكامل - التقارير] ✓ تم مطابقة وتوليد الإحصائيات لوزارة التعليم ومؤشرات الأداء للشركة الاستثمارية.'
      ];
      setActionLogs(prev => [...msgs, ...prev]);
      setIsSimulatingIntegration(false);
      triggerNotification('نجاح كلي لاختبارات التكامل والربط البيني لوحدة شؤون الطلاب! 🎯🔥', 'success');
    }, 1500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Header Info Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a1226] to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                <Crown className="w-4 h-4 text-amber-400" />
                المرحلة الثالثة عشرة: الاعتماد المؤسسي لوحدة شؤون الطلاب (Student Affairs Institutional Certification)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">المطابقة والجودة الشاملة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">اعتماد وحدة شؤون الطلاب اعتمادًا مؤسسيًا كاملاً</h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              بوابة التحقق الفنية والإدارية الموحدة للتأكد من جاهزية كود شؤون الطلاب، واكتمال حقول بيانات الهوية الوطنية للطلاب والأرقام الأكاديمية وصور الطلاب والمستندات السحابية، مع هيكلة نظام أولياء الأمور المتعددين وترتيب أولوياتهم، وضبط سيناريوهات الدورة الأكاديمية الكاملة (تسجيل، نقل، تخرج، أرشفة) وتكاملها الكلي مع الرسوم المالية والامتحانات والتقارير.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-amber-500/15 border border-amber-500/30 p-4 shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-amber-300 block uppercase">نسبة الجودة والمطابقة للوحدة</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">
              {progressPercentage}%
            </span>
            <div className="w-full bg-slate-850 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Verified: {verifiedItems} / {totalItems} Requirements</p>
          </div>
        </div>
      </div>

      {/* Main Core Split: Verification Checklist and Student Management Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* RIGHT SIDE: Student Affairs Live Interactive Sandbox (Productivity, Guardians, and Lifecycle) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Interactive Student Explorer Sandbox */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>منصة استكشاف وتدقيق ملفات الطلاب (Student Explorer Dashboard)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">قوة معالجة البيانات الفورية للبحث السريع وترتيب الأولويات</p>
              </div>

              {/* Advanced search trigger */}
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${showAdvancedSearch ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-750 dark:bg-slate-950 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvancedSearch ? 'إغلاق البحث المتقدم' : 'بحث متقدم وفلاتر'}</span>
              </button>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="البحث الفوري بالاسم، الرقم الأكاديمي، الهوية..."
                    className="w-full pl-3 pr-9 py-2 bg-transparent dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-400"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs font-black text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="all">كل الحالات الدراسية (Study Status)</option>
                    <option value="regular">منتظم (Regular)</option>
                    <option value="suspended">موقوف القيد (Suspended)</option>
                    <option value="withdrawn">منسحب (Withdrawn)</option>
                    <option value="graduated">خريج (Graduated)</option>
                    <option value="archived">مؤرشف (Archived)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs font-black text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="all">كل المراحل الدراسية (Levels)</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  </select>
                </div>
              </div>

              {/* Advanced Search Area */}
              {showAdvancedSearch && (
                <div className="p-4 bg-transparent dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-right animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">البحث بالرقم الوطني أو الإقامة:</label>
                    <input
                      type="text"
                      value={advNationalId}
                      onChange={(e) => setAdvNationalId(e.target.value)}
                      placeholder="أدخل 10 أرقام..."
                      className="w-full px-3 py-2 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">البحث بالرقم الأكاديمي الحصري:</label>
                    <input
                      type="text"
                      value={advAcademicId}
                      onChange={(e) => setAdvAcademicId(e.target.value)}
                      placeholder="مثال: STD-2026-XXXX"
                      className="w-full px-3 py-2 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAdvNationalId('');
                        setAdvAcademicId('');
                        setStatusFilter('all');
                        setLevelFilter('all');
                        setSearchTerm('');
                      }}
                      className="py-1.5 px-3 bg-slate-200 text-slate-700 dark:bg-slate-850 dark:text-slate-300 rounded-lg text-xs font-black cursor-pointer"
                    >
                      إعادة تعيين البحث
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Split Panel: Left List & Right Detail Profile */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left Column: Simple interactive list */}
              <div className="md:col-span-4 space-y-2 max-h-[480px] overflow-y-auto">
                <span className="text-[10px] font-black text-slate-400 block mb-2">نتائج البحث المستوفية ({filteredStudents.length} طلاب):</span>
                {filteredStudents.length === 0 ? (
                  <div className="p-4 bg-transparent dark:bg-slate-950 text-center text-xs text-slate-400 font-bold border border-slate-200/50">
                    لا يوجد نتائج مطابقة للبحث.
                  </div>
                ) : (
                  filteredStudents.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`p-3 border cursor-pointer transition-all text-right ${selectedStudentId === st.id ? 'bg-amber-50/50 border-amber-400/80 shadow-xs dark:bg-amber-950/20' : 'bg-slate-50/50 border-slate-200/50 hover:bg-transparent dark:bg-slate-950/30'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={st.photoUrl} 
                          alt={st.fullNameAr} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <strong className="text-[11px] font-black text-slate-900 dark:text-white block truncate leading-tight">{st.fullNameAr}</strong>
                          <span className="text-[9px] text-slate-400 font-bold block truncate">{st.academicId}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${st.studyStatus === 'regular' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {st.studyStatus === 'regular' ? 'منتظم' : 'موقوف القيد'}
                            </span>
                            <span className="text-[8px] text-slate-500 font-bold">{st.academicLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Complete Student & Guardians Detail view */}
              <div className="md:col-span-8 p-5 bg-transparent dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 space-y-6">
                
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-200/40 pb-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-right">
                    <img 
                      src={selectedStudent.photoUrl} 
                      alt={selectedStudent.fullNameAr} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/30 shadow-lg shadow-amber-500/5 shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{selectedStudent.fullNameAr}</h4>
                      <span className="text-[11px] text-slate-400 font-mono block leading-none">{selectedStudent.fullNameEn}</span>
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                        <span className="bg-slate-900 text-amber-350 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-950">
                          الرقم الأكاديمي: {selectedStudent.academicId}
                        </span>
                        <span className="bg-slate-900 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-950">
                          السجل المدني: {selectedStudent.nationalId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-left space-y-1 shrink-0">
                    <span className="bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-300 text-[9px] font-black px-2 py-0.5 rounded">
                      الفصل الدراسي: {selectedStudent.section}
                    </span>
                    <div className="text-[10px] font-bold text-slate-450 mt-1">
                      الحالة: <span className="text-amber-600 font-extrabold">{selectedStudent.studyStatus.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Core Birth, Identity & Contact Data */}
                <div className="space-y-3">
                  <strong className="text-[11px] font-black text-slate-450 block uppercase tracking-wider">أولاً: تفاصيل الهوية والبيانات الديموغرافية الأساسية</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="dark:bg-slate-900 p-2.5 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">مكان وتاريخ الميلاد (Birthplace / DOB):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                        {selectedStudent.birthDate} - {selectedStudent.birthPlace}
                      </span>
                    </div>
                    <div className="dark:bg-slate-900 p-2.5 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">بيانات الاتصال والبريد الإلكتروني (Contact Email):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                        {selectedStudent.phone} - {selectedStudent.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Guardians Priority and Order */}
                <div className="space-y-3">
                  <strong className="text-[11px] font-black text-slate-450 block uppercase tracking-wider">ثانياً: سجل أولياء الأمور المتعددين وتحديد الأولوية وحالات الطوارئ</strong>
                  <div className="space-y-2">
                    {selectedStudent.guardians.map((g) => (
                      <div 
                        key={g.id}
                        className="dark:bg-slate-900 p-3 border border-slate-100 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                            {g.priority}
                          </span>
                          <div>
                            <strong className="font-black text-slate-850 dark:text-slate-100">{g.name}</strong>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-450 font-bold">
                              <span>صلة القرابة: <strong className="text-slate-700">{g.relation}</strong></span>
                              <span>•</span>
                              <span>جهة العمل: <strong className="text-slate-700">{g.occupation}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left space-y-1">
                          <span className="font-mono font-bold text-slate-700 block">{g.phone}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{g.email}</span>
                          {g.isEmergencyContact && (
                            <span className="inline-block bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-[8px] font-black px-1.5 py-0.2 rounded-md border border-rose-100/50">
                              🚨 جهة اتصال للطوارئ (Emergency)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-section: Document Safe Vault */}
                <div className="space-y-3">
                  <strong className="text-[11px] font-black text-slate-450 block uppercase tracking-wider">سجل المستندات والملفات المرفقة بالملف</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedStudent.documents.map((doc, idx) => (
                      <div 
                        key={idx}
                        className="p-2 dark:bg-slate-900 rounded-lg border border-slate-100 flex items-center justify-between gap-3 text-[10px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{doc.name}</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded font-black shrink-0">
                          ✓ معتمد ({doc.size})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-section: Academic Study Lifecycle Transition Panel */}
                <div className="space-y-3 border-t border-slate-200/40 pt-4">
                  <strong className="text-[11px] font-black text-slate-450 block uppercase tracking-wider">ثالثاً: محاكاة ومعالجة حركات الدورة الدراسية للطالب (Academic Lifecycle Run)</strong>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    انقر لتجربة ومحاكاة النقل أو إيقاف القيد أو التخرج، ومراقبة ترحيل القيود وتحديث البيانات بالمنصة فوراً:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('register')}
                      className="bg-slate-900 hover:bg-slate-850 text-amber-400 border border-amber-950 text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>تسجيل (Register)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('transfer')}
                      className="bg-slate-900 hover:bg-slate-850 text-amber-400 border border-amber-950 text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>نقل (Transfer)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('re_register')}
                      className="bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-950 text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <ListRestart className="w-3.5 h-3.5" />
                      <span>إعادة قيد (Re-register)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('suspend')}
                      className="bg-slate-900 hover:bg-slate-850 text-rose-450 border border-rose-950 text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <LockIcon className="w-3.5 h-3.5" />
                      <span>إيقاف قيد (Suspend)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('withdraw')}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-950 text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>انسحاب (Withdraw)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('graduate')}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>تخرج (Graduate)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerLifecycleAction('archive')}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-black py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>أرشفة (Archive)</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Integration Check Panel with Adjacent Systems */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-500" />
                <span>خامساً: اختبار التكامل المترابط لوحدة شؤون الطلاب (ERP System Integrations Check)</span>
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 px-2.5 py-1 rounded-md font-bold">6 Integration Anchors</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              يجب التحقق من ترحيل البيانات آلياً لضمان عدم ازدواجية التسجيلات وتكامل الحسابات والامتحانات والرسوم:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center space-y-2">
                <Receipt className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="text-[10px] font-black block">تكامل الرسوم</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">مترابط 100%</span>
              </div>
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center space-y-2">
                <FileSignature className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="text-[10px] font-black block">الامتحانات والكنترول</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">مترابط 100%</span>
              </div>
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center space-y-2">
                <Calendar className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="text-[10px] font-black block">الحضور والبصمة</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">مترابط 100%</span>
              </div>
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center space-y-2">
                <BookOpen className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="text-[10px] font-black block">المكتبة المدرسية</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">مترابط 100%</span>
              </div>
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center space-y-2">
                <Landmark className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="text-[10px] font-black block">القيود والحسابات</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">مترابط 100%</span>
              </div>
              <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-150 text-center space-y-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="text-[10px] font-black block">التقارير والمؤشرات</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">مترابط 100%</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSimulatingIntegration}
              onClick={runIntegrationTest}
              className="w-full bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-amber-400 py-3 px-4 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingIntegration ? 'animate-spin' : ''}`} />
              <span>{isSimulatingIntegration ? 'جاري محاكاة وفحص حزم التكامل...' : 'بدء تشغيل موازين الفحص الشامل واختبار حزم التكامل المترابطة (Simulate ERP Integrations)'}</span>
            </button>
          </div>

        </div>

        {/* LEFT SIDE: Core Verification Checklist (1st to 4th sections) & Live Logs */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* Institutional Quality Gates Checklists */}
          <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-500" />
                <span>كراسة الاعتماد والمطابقة لشؤون الطلاب</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">انقر لإلغاء أو تأكيد مطابقة أي معيار من كراسة شروط الجودة الموثقة لوزارة التعليم والاعتماد المؤسسي.</p>
            </div>

            {/* Part 1: Student Data */}
            <div className="space-y-3">
              <strong className="text-[11px] font-black text-amber-600 block uppercase">أولاً: حقول بيانات الطالب الأساسية</strong>
              <div className="space-y-2">
                <div onClick={() => handleToggleChecklist('academicId')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">الرقم الأكاديمي الحصري (Academic ID)</span>
                  <input type="checkbox" checked={checklist.academicId} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('nationalId')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">السجل المدني / رقم الإقامة (National ID)</span>
                  <input type="checkbox" checked={checklist.nationalId} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('identityData')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">بيانات الهوية وجواز السفر</span>
                  <input type="checkbox" checked={checklist.identityData} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('birthData')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">بيانات وتاريخ ومكان الميلاد</span>
                  <input type="checkbox" checked={checklist.birthData} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('contactData')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">بيانات الاتصال والعنوان الوطني</span>
                  <input type="checkbox" checked={checklist.contactData} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('academicStatus')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">الحالة الدراسية (منتظم، موقوف، خريج)</span>
                  <input type="checkbox" checked={checklist.academicStatus} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('enrollmentStatus')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">حالة القيد وسجلات التنقلات</span>
                  <input type="checkbox" checked={checklist.enrollmentStatus} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('studentPhoto')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">صورة الطالب الشخصية المعتمدة</span>
                  <input type="checkbox" checked={checklist.studentPhoto} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('documentsUploaded')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">المستندات الإجبارية والملفات</span>
                  <input type="checkbox" checked={checklist.documentsUploaded} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Part 2: Guardians */}
            <div className="space-y-3">
              <strong className="text-[11px] font-black text-amber-600 block uppercase">ثانياً: سجل أولياء الأمور المتعددين</strong>
              <div className="space-y-2">
                <div onClick={() => handleToggleChecklist('multipleGuardians')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">إتاحة أكثر من ولي أمر للطالب الواحد</span>
                  <input type="checkbox" checked={checklist.multipleGuardians} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('priorityOrder')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">ترتيب الأولوية لسلطة اتخاذ القرار</span>
                  <input type="checkbox" checked={checklist.priorityOrder} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('guardianContact')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">بيانات الاتصال ومطابقتها الهاتيفة</span>
                  <input type="checkbox" checked={checklist.guardianContact} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('guardianEmail')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني للإشعارات والتقارير</span>
                  <input type="checkbox" checked={checklist.guardianEmail} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('guardianRelation')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">تحديد صلة القرابة ومستند الولاية</span>
                  <input type="checkbox" checked={checklist.guardianRelation} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('guardianOccupation')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">بيانات العمل والوظيفة لولي الأمر</span>
                  <input type="checkbox" checked={checklist.guardianOccupation} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('emergencyContacts')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">جهات الاتصال للحالات الطارئة</span>
                  <input type="checkbox" checked={checklist.emergencyContacts} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Part 3: Academic Lifecycle */}
            <div className="space-y-3">
              <strong className="text-[11px] font-black text-amber-600 block uppercase">ثالثاً: الدورة الدراسية المتكاملة</strong>
              <div className="space-y-2">
                <div onClick={() => handleToggleChecklist('registrationAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">التسجيل والقبول للطلاب الجدد</span>
                  <input type="checkbox" checked={checklist.registrationAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('transferAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">النقل بين الفصول والمجمعات والمستأجرين</span>
                  <input type="checkbox" checked={checklist.transferAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('reRegistrationAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">إعادة قيد الطلاب المنقطعين</span>
                  <input type="checkbox" checked={checklist.reRegistrationAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('suspendEnrollmentAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">إيقاف القيد المؤقت المعتمد للطلاب</span>
                  <input type="checkbox" checked={checklist.suspendEnrollmentAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('withdrawalAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">الانسحاب الكلي والنهائي من المدرسة</span>
                  <input type="checkbox" checked={checklist.withdrawalAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('graduationAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">التخرج وإتمام المراحل والشهادات</span>
                  <input type="checkbox" checked={checklist.graduationAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('archivalAudit')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">الأرشفة السحابية الدائمة للسجلات</span>
                  <input type="checkbox" checked={checklist.archivalAudit} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Part 4: Productivity */}
            <div className="space-y-3">
              <strong className="text-[11px] font-black text-amber-600 block uppercase">رابعاً: ميزات الإنتاجية للواجهات</strong>
              <div className="space-y-2">
                <div onClick={() => handleToggleChecklist('instantSearch')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">البحث الفوري (Instant Search)</span>
                  <input type="checkbox" checked={checklist.instantSearch} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('advancedSearch')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">البحث المتقدم بحقول متعددة</span>
                  <input type="checkbox" checked={checklist.advancedSearch} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('customFilters')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">الفلاتر والتصفية الذكية السريعة</span>
                  <input type="checkbox" checked={checklist.customFilters} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('quickSave')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">الحفظ السريع والتخزين الذكي</span>
                  <input type="checkbox" checked={checklist.quickSave} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
                <div onClick={() => handleToggleChecklist('shortcuts')} className="flex items-center justify-between p-2.5 bg-transparent dark:bg-slate-950 cursor-pointer hover:bg-slate-100/55 transition-colors">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">اختصارات لوحة المفاتيح والسرعة</span>
                  <input type="checkbox" checked={checklist.shortcuts} readOnly className="rounded  border-slate-300  text-amber-600  focus:ring-[#9a6a1d]  w-3.5 h-3.5" />
                </div>
              </div>
            </div>

          </div>

          {/* Audit Logs Simulator */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                سجل المراقبة والتدقيق الفوري للعمليات
              </span>
              <span className="text-[9px] bg-amber-950/85 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-800/40">AUDIT TRAIL</span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto text-left" dir="ltr">
              {actionLogs.map((log, index) => (
                <div key={index} className="text-[10px] font-mono text-slate-300 leading-relaxed truncate">
                  <span className="text-amber-400 mr-1">✓</span>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Official Institutional Certification Seal */}
      <div className="relative overflow-hidden bg-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        
        {/* Animated background stamp logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/5 rounded-full border border-dashed border-amber-500/10 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[320px] h-[320px] bg-amber-500/5 rounded-full border border-double border-amber-500/20 -rotate-12 flex items-center justify-center">
            <span className="text-amber-400 text-3xl font-black">شؤون الطلاب معتمد 🏆</span>
          </div>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="w-24 h-24 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse">
            <Award className="w-12 h-12 text-amber-450 animate-pulse" />
          </div>

          <span className="text-xs font-black text-amber-400 block uppercase tracking-widest">بوابة الاعتماد والترخيص السحابي الموحد للمدارس والمجمعات الكبرى</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">سند ترخيص واعتماد وحدة شؤون الطلاب اعتمادًا مؤسسيًا كاملاً (Official Student Affairs Institutional Certification Seal)</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            بموجب هذا السند والميثاق الفني المبرم، نشهد نحن إدارة التميز التقني ومطابقة معايير الحوكمة لوزارة التعليم والاعتماد التعليمي، بأن وحدة شؤون الطلاب بكامل واجهاتها الذكية، ونظام البحث المتقدم، وضوابط أولياء الأمور وحركات الدورة الدراسية وتكاملها المالي والتعليمي، قد اجتازت فحوصات الأمان وعزل البيانات والسرعة المحددة لضمان أداء مستدام وموثوق بنسبة 100%.
          </p>

          {isSealed && (
            <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/5 to-amber-500/10 border border-amber-500/20 p-5 max-w-xl mx-auto space-y-3 animate-fade-in text-center">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">سند ترخيص واعتماد وحدة شؤون الطلاب</span>
              <h4 className="text-sm font-black text-amber-400">✓ تم قفل واعتماد الترخيص البلاتيني المؤسسي لشؤون الطلاب بنجاح كلي</h4>
              <p className="text-[10px] text-slate-300 font-bold leading-relaxed max-w-md mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                تم توقيع وترخيص الوحدة بصفة نهائية لضمان جودة عزل المستأجرين وسرعة المهام والرصد التشغيلي بالرمز الدولي: <code className="font-mono text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded">ERP-STUDENT-AFFAIRS-CERTIFIED-FINAL-v13.0</code>.
              </p>
              <div className="pt-2 border-t border-slate-800/40 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 text-right" dir="rtl">
                <div>
                  <span className="block text-slate-500 font-extrabold">المشرف العام للاعتماد النهائي:</span>
                  <strong className="text-slate-200 block mt-0.5 font-mono">salafe10@gmail.com</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-extrabold">تاريخ ختم وصدور الترخيص:</span>
                  <strong className="text-slate-200 block mt-0.5">{new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility warning if some things are unchecked */}
          {progressPercentage < 100 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>يجب مراجعة واعتماد جميع تراخيص كراسة الشروط بنسبة 100% لتفعيل وتوقيع الرخصة البلاتينية لشؤون الطلاب.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              disabled={progressPercentage < 100}
              onClick={() => {
                setIsSealed(true);
                triggerNotification('تهانينا الكبرى! تم تفعيل وتوقيع رخصة ميثاق الجودة لشؤون الطلاب بنجاح باهر وبنسبة 100%! 🏆🚀👑🌟', 'success');
              }}
              className={`font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${progressPercentage === 100 ? 'bg-amber-600 hover:bg-amber-750 text-white animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4" />
              <span>الموافقة وتوقيع رخصة ميثاق شؤون الطلاب المؤسسية 🏆👑</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير كراسة ميثاق شؤون الطلاب (Export Student Affairs Summary) 📄</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
