import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ArrowRight, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  ChevronDown, 
  Database, 
  Eye, 
  EyeOff, 
  LockKeyhole, 
  Moon, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  User, 
  Users,
  Building,
  GraduationCap,
  BookOpen,
  Award,
  Bus,
  School as SchoolIcon,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import { School, Branch } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SmartPortalGatewayProps {
  schools: School[];
  branches?: Branch[];
  onSchoolLogin: (username: string, password: string) => void;
  onAdminLogin: (username: string, password: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'info') => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isClientMode?: boolean;
  initialTab?: 'school' | 'admin';
}

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err: any) {
      EnterpriseLogger.warn('Clipboard API failed, trying fallback...', "SmartPortalGateway", { details: err });
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err: any) {
    EnterpriseLogger.error('Fallback copying failed:', "SmartPortalGateway", { error: err });
    document.body.removeChild(textArea);
    return false;
  }
};

export default function SmartPortalGateway({
  schools,
  branches = [],
  onSchoolLogin,
  onAdminLogin,
  triggerNotification,
  theme,
  onThemeToggle,
  isClientMode = false,
  initialTab = 'school'
}: SmartPortalGatewayProps) {
  const [activeTab, setActiveTab] = useState<'school' | 'admin'>(initialTab);
  const [selectedSchoolId] = useState<string>(schools[0]?.id || '');
  
  // Login credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Progress simulation state
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const [loginStepText, setLoginStepText] = useState('');

  // Get active selected school object for dynamic branding
  const currentSchool = useMemo(() => {
    return schools.find(s => s.id === selectedSchoolId) || schools[0] || {
      id: '',
      name: 'مدرسة غير محددة',
      logo: '🏫',
      licenseNumber: 'غير متحقق',
      academicYear: 'غير متحقق',
      motto: 'بيانات المنشأة غير متاحة من مصدر موثوق'
    };
  }, [schools, selectedSchoolId]);


  const stepsList = [
    'جاري التشفير والتحقق من القناة الأمنية...',
    'مطابقة اسم المستخدم وكلمة المرور...',
    'تحميل الهوية البصرية وتراخيص المستأجر...',
    'الانتقال اللحظي للوحة التحكم الرئيسية...'
  ];

  const handleSchoolSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      triggerNotification('يرجى إدخال اسم المستخدم أو البريد الإلكتروني', 'warning');
      return;
    }
    if (!password.trim()) {
      triggerNotification('يرجى إدخال كلمة المرور الخاصة بحسابك', 'warning');
      return;
    }

    setIsLoggingIn(true);
    setLoginProgress(0);
    setLoginStepText(stepsList[0]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setLoginProgress(progress);
      
      const stepIdx = Math.min(Math.floor(progress / 25), stepsList.length - 1);
      setLoginStepText(stepsList[stepIdx]);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoggingIn(false);
          onSchoolLogin(username, password);
        }, 250);
      }
    }, 180);
  };

  const handleAdminSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      triggerNotification('يرجى إدخال البريد الإلكتروني الإداري المعتمد', 'warning');
      return;
    }
    if (!adminPassword.trim()) {
      triggerNotification('يرجى كتابة كلمة مرور الإدارة المركزية', 'warning');
      return;
    }

    setIsLoggingIn(true);
    setLoginProgress(0);
    setLoginStepText('التحقق من مفاتيح الإدارة العليا...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setLoginProgress(progress);
      
      if (progress === 50) setLoginStepText('تجاوز الحظر ومطابقة الهوية المركزية...');
      if (progress === 75) setLoginStepText('تهيئة لوحة التحكم الفوقية والنسخ الاحتياطي...');

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoggingIn(false);
          onAdminLogin(username, adminPassword);
        }, 250);
      }
    }, 180);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between font-sans select-none relative" dir="rtl">
      
      {/* Background Decorative Ambient Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-black pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-25 z-0" />

      {/* Floating Ambient Lighting Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP COMPACT BRANDING HEADER */}
      <header className="relative z-10 w-full px-6 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Dynamic School Emblem / Logo */}
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 via-[#dfb55a] to-[#fce29a] p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-sm shadow-inner">
              {currentSchool.logo || '🏫'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black text-white tracking-wide">{currentSchool.name}</h1>
              <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-black">
                بوابة المدرسة المعتمدة
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {currentSchool.motto || 'نظام إدارة التعلم والعمليات المدرسية الذكية'} • العام الدراسي {currentSchool.academicYear || '2026/2027'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* The school is resolved by the trusted identity after login. */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-[11px] text-slate-300">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">سيتم تحديد المدرسة بعد التحقق</span>
          </div>

          {/* System status pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-300">الاتصال الآمن:</span>
            <span className="text-slate-400 font-extrabold font-mono">SSL غير متحقق</span>
          </div>

          {/* Mode Switcher Tab (Only if NOT forced in Client Mode) */}
          {!isClientMode && (
            <div className="flex bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('school')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTab === 'school' 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                بوابة المدرسة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTab === 'admin' 
                    ? 'bg-amber-600 text-white font-black shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الإدارة المركزية
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* MAIN SPLIT SCREEN CONTAINER (Strictly Full Bleed, No Scroll) */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto overflow-hidden">
        
        {/* LEFT COLUMN: SCHOOL BRANDING & INSTITUTIONAL PRESENTATION (5 Cols) */}
        <div className="md:col-span-5 lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden h-full max-h-[560px]">
          
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Identity */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-800 border border-slate-700/80 flex items-center justify-center text-3xl shadow-lg shrink-0">
                {currentSchool.logo || '🏫'}
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest bg-amber-950/60 border border-amber-900/50 px-2.5 py-0.5 rounded-full inline-block">
                  المؤسسة التعليمية المرخصة
                </span>
                <h2 className="text-lg lg:text-xl font-black text-white mt-1 leading-snug">
                  {currentSchool.name}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  رقم الترخيص الوزاري: <span className="font-mono text-slate-300">{currentSchool.licenseNumber}</span>
                </p>
              </div>
            </div>

            {/* Slogan & Welcome Banner */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>أهلاً بكم في البوابة الإلكترونية الموحدة</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {currentSchool.motto || 'نظام سحاب المتكامل لإدارة جميع الأقسام الأكاديمية والمالية والإدارية تحت بيئة عمل موحدة وسريعة.'}
              </p>
            </div>

            {/* Key Modular Systems Badge Grid */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-slate-400">الوحدات والمنظومات النشطة للمدرسة:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 p-2.5 text-slate-200">
                  <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-[11px]">شؤون الطلاب والنتائج</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 p-2.5 text-slate-200">
                  <Users className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="font-bold text-[11px]">الكادر التعليمي</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 p-2.5 text-slate-200">
                  <Database className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-[11px]">الحسابات والرسوم</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 p-2.5 text-slate-200">
                  <Bus className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-[11px]">النقل والزي المدرسي</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono relative z-10">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>حماية وتشفير عالي الأمان</span>
            </span>
            <span>v4.5 Enterprise</span>
          </div>

        </div>

        {/* RIGHT COLUMN: CORE LOGIN CARD ONLY (7 Cols) */}
        <div className="md:col-span-7 lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center h-full max-h-[560px]">
          
          <AnimatePresence mode="wait">
            {activeTab === 'school' ? (
              <motion.form 
                key="school-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSchoolSubmission}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-5 rounded-md bg-amber-500 shrink-0" />
                    <h2 className="text-lg font-black text-white">تسجيل الدخول للنظام المدرسي</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    أدخل بيانات الاعتماد المعتمدة الخاصة بحسابك للولوج إلى خدمات المدرسة.
                  </p>
                </div>

                <div className="border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs font-bold leading-relaxed text-amber-200">
                  المدرسة والدور والفرع يتم تحديدها من الهوية الموثوقة بعد نجاح التحقق، ولا يمكن اختيارها من جهاز المستخدم.
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    👤 اسم المستخدم / البريد الإلكتروني:
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4 text-amber-500" />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white text-xs font-bold pr-11 pl-4 py-2.5 outline-none transition-all"
                      placeholder="اسم المستخدم الخاص بالحساب"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    🔑 كلمة المرور:
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                      <LockKeyhole className="w-4 h-4 text-amber-500" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white text-xs font-bold pr-11 pl-11 py-2.5 outline-none transition-all font-mono"
                      placeholder="كلمة المرور المشفرة"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white px-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-medium">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                    />
                    <span>تذكر بيانات الدخول على هذا الجهاز</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => triggerNotification('يرجى التواصل مع إدارة المدرسة لإعادة تعيين كلمة المرور', 'info')}
                    className="text-amber-400 hover:underline font-bold text-xs"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* Login Button or Progress Bar */}
                <div className="pt-2">
                  {isLoggingIn ? (
                    <div className="w-full bg-slate-950 border border-slate-800 p-3 text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>{loginStepText}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-150" style={{ width: `${loginProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-[#dfb55a] hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>تسجيل الدخول للبوابة</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.form>
            ) : (
              /* SUPER ADMIN LOGIN FORM */
              <motion.form 
                key="admin-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleAdminSubmission}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-5 rounded-md bg-amber-600 shrink-0" />
                    <h2 className="text-lg font-black text-white">الإدارة المركزية والتشغيل الفوقي</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    منفذ الدعم والمراقبة العليا للمنصة، وإدارة تراخيص المدارس والنسخ الاحتياطي.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    👨‍💻 البريد الإلكتروني الإداري المعتمد:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="البريد الإلكتروني لحساب الإدارة"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white text-xs font-bold px-4 py-2.5 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    🔑 كلمة المرور الفوقية:
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                      <LockKeyhole className="w-4 h-4 text-amber-500" />
                    </span>
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white text-xs font-bold pr-11 pl-11 py-2.5 outline-none transition-all font-mono"
                      placeholder="كلمة مرور الإدارة الكبرى"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white px-1 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  {isLoggingIn ? (
                    <div className="w-full bg-slate-950 border border-slate-800 p-3 text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>{loginStepText}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full transition-all duration-150" style={{ width: `${loginProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/10 hover:shadow-amber-600/20 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>ولوج لوحة الإدارة المركزية</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2 shrink-0">
        <div>
          منظومة سحاب التعليمية ERP © {new Date().getFullYear()} — جميع الحقوق محفوظة للمدرسة المعتمدة.
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-300 transition-colors cursor-pointer">سياسة الاستخدام للعميل</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">الدعم الفني والخدمات المدرسية</span>
        </div>
      </footer>

    </div>
  );
}
