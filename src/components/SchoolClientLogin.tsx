import React, { useState } from 'react';
import { 
  Building2, 
  LockKeyhole, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  ChevronDown,
  Headphones,
  Globe,
  TrendingUp,
  Puzzle,
  MousePointerClick,
  Award,
  Sun,
  Moon,
  GitBranch
} from 'lucide-react';
import { School } from '../types';

interface SchoolClientLoginProps {
  selectedSchool: School;
  onSchoolLogin: (username: string, password: string, rememberMe: boolean) => void | Promise<void>;
  onForgotPassword?: (identifier: string) => boolean | Promise<boolean>;
  onSwitchToSuperAdminLogin?: () => void;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'info') => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export default function SchoolClientLogin({
  selectedSchool,
  onSchoolLogin,
  onForgotPassword,
  onSwitchToSuperAdminLogin,
  triggerNotification,
  theme,
  onThemeToggle
}: SchoolClientLoginProps) {
  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showRecoveryRequest, setShowRecoveryRequest] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      triggerNotification('يرجى إدخال اسم المستخدم أو البريد الإلكتروني للوصول للنظام', 'warning');
      return;
    }
    if (!password.trim()) {
      triggerNotification('يرجى إدخال كلمة المرور الخاصة بك', 'warning');
      return;
    }
    setIsLoggingIn(true);
    try {
      await onSchoolLogin(username.trim(), password, rememberMe);
    } finally {
      setIsLoggingIn(false);
    }
  };
  const handleForgotPassword = async () => {
    const email = recoveryEmail.trim();
    if (!email) {
      setShowRecoveryRequest(true);
      triggerNotification('أدخل اسم المستخدم أو البريد الإلكتروني المسجل لاستعادة كلمة المرور.', 'info');
      return;
    }
    if (onForgotPassword) {
      setIsSendingRecovery(true);
      try {
        const success = await onForgotPassword(email);
        if (success) setShowRecoveryRequest(false);
      } finally {
        setIsSendingRecovery(false);
      }
      return;
    }
    triggerNotification('استخدم البريد المسجل لطلب استعادة كلمة المرور.', 'info');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden font-sans dir-rtl select-none transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-gradient-to-b from-[#dfcaaa] via-[#f3e7d3] to-[#cbb28d] text-[#3d2b0f]'
    }`} dir="rtl">
      
      {/* BACKGROUND DECORATIVE ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Soft Golden Ambient Glow */}
        <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl opacity-70 ${
          isDark 
            ? 'bg-gradient-to-b from-amber-500/20 via-amber-700/10 to-transparent' 
            : 'bg-gradient-to-b from-[#fef3c7]/60 via-[#fde047]/20 to-transparent'
        }`} />

        {/* Golden Curved Wave Ornaments */}
        <svg className={`absolute -left-20 bottom-0 w-[600px] h-[500px] ${isDark ? 'text-amber-500/10' : 'text-[#c5a059]/20'}`} viewBox="0 0 500 500" fill="currentColor">
          <path d="M0,100 C150,200 350,0 500,250 L500,500 L0,500 Z" />
        </svg>
        <svg className={`absolute -right-20 top-0 w-[600px] h-[500px] ${isDark ? 'text-amber-400/10' : 'text-[#d4af37]/20'}`} viewBox="0 0 500 500" fill="currentColor">
          <path d="M0,0 L500,0 C350,200 150,50 0,300 Z" />
        </svg>

        {/* Left Side: School Building Graphic Rendering Illustration */}
        <div className="hidden lg:block absolute left-4 bottom-12 w-[380px] xl:w-[440px] opacity-85 filter drop-shadow-2xl">
          <div className={`relative rounded-3xl overflow-hidden border-2 p-2 ${
            isDark 
              ? 'border-amber-500/30 bg-slate-900/90' 
              : 'border-[#c5a059]/40 bg-gradient-to-tr from-[#3a2c1a]/80 via-[#22180e]/60 to-transparent'
          }`}>
            <img 
              src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&fit=crop&q=80" 
              alt="المدرسة" 
              className="w-full h-72 object-cover opacity-90 sepia contrast-125"
              referrerPolicy="no-referrer"
            />
            <div className={`absolute inset-0 flex flex-col justify-end p-4 ${
              isDark 
                ? 'bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent' 
                : 'bg-gradient-to-t from-[#2a1d0f] via-[#2a1d0f]/40 to-transparent'
            }`}>
              <span className="text-white font-black text-sm tracking-wide">صرح تعليمي نموذجي متكامل</span>
              <span className="text-[#eab308] text-xs font-bold">إدارة ذكية ومستقبلية للمؤسسات المدرسية</span>
            </div>
          </div>
        </div>

        {/* Right Side: Golden Globe & Trophy Decorative Graphics */}
        <div className="hidden lg:flex absolute right-6 bottom-16 flex-col items-center gap-4 opacity-90 filter drop-shadow-2xl">
          <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#8b6508] via-[#d4af37] to-[#fef08a] p-1 shadow-2xl flex items-center justify-center">
            <div className={`w-full h-full rounded-full p-4 flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-slate-950' : 'bg-[#2a1d0f]'
            }`}>
              <Globe className="w-16 h-16 text-[#fef08a] animate-pulse" />
              <span className="text-white font-black text-xs mt-2">نظام ERP العالمي</span>
              <span className="text-[#c5a059] text-[10px] font-bold">لإدارة المدارس</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#d4af37] via-[#fef08a] to-[#8b6508] text-slate-950 px-4 py-2 font-black text-xs flex items-center gap-2 border border-amber-200">
            <Award className="w-4 h-4 text-slate-950" />
            <span>SchoolForManus • الجودة والتميز</span>
          </div>
        </div>

      </div>

      {/* TOP HEADER CONTROLS */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between">
        
        {/* Top-Right: Language Dropdown & Theme Toggle */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => triggerNotification('اللغة الحالية: العربية (النموذج المعتمد)', 'info')}
            className={`border font-extrabold text-xs px-4 py-2 rounded-full shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/30 text-amber-200' 
                : 'bg-[#f7efe1]/90 hover:bg-[#f0e3cc] border-[#c5a059]/50 text-[#5c4015]'
            }`}
          >
            <Globe className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-[#8b6508]'}`} />
            <span>العربية</span>
            <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-[#8b6508]'}`} />
          </button>

          <button
            type="button"
            onClick={onThemeToggle}
            className={`p-2 border rounded-full shadow-md transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/30 text-amber-300' 
                : 'bg-[#f7efe1]/90 hover:bg-[#f0e3cc] border-[#c5a059]/50 text-[#5c4015]'
            }`}
            title={isDark ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8b6508]" />}
          </button>
        </div>

        {/* Top-Left: Technical Support & Gateway Switch */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => triggerNotification('للحصول على الدعم، راجع مسؤول النظام المعتمد في مؤسستك.', 'info')}
            className={`border font-extrabold text-xs px-4 py-2 rounded-full shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/30 text-amber-200' 
                : 'bg-[#f7efe1]/90 hover:bg-[#f0e3cc] border-[#c5a059]/50 text-[#5c4015]'
            }`}
          >
            <Headphones className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-[#8b6508]'}`} />
            <span>الدعم الفني</span>
          </button>

          {onSwitchToSuperAdminLogin && (
            <button
              type="button"
              onClick={onSwitchToSuperAdminLogin}
              className={`font-bold text-xs px-3.5 py-2 rounded-full border shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-300' 
                  : 'bg-[#2a1d0f] hover:bg-[#3d2c18] text-[#fef08a] border-[#c5a059]/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">الإدارة المركزية</span>
            </button>
          )}
        </div>

      </header>

      {/* MAIN CENTER SECTION */}
      <main className="relative z-10 my-auto w-full max-w-7xl mx-auto px-4 py-4 flex flex-col items-center justify-center">
        
        {/* BRAND IDENTITY LOGO AT TOP OF FORM */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          {/* 3D Gold Logo Emblem */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#78540c] via-[#d4af37] to-[#fef08a] p-1 shadow-2xl shadow-[#5c4015]/40 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className={`w-full h-full rounded-[22px] flex items-center justify-center border border-[#fef08a]/40 ${
              isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-[#2a1e12] to-[#171008]'
            }`}>
              <span className="text-3xl font-black bg-gradient-to-r from-[#fef08a] via-[#eab308] to-[#ca8a04] bg-clip-text text-transparent tracking-tighter filter drop-shadow">
                EP
              </span>
            </div>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-black mt-3 tracking-tight ${
            isDark ? 'text-white' : 'text-[#2d1e0c]'
          }`}>
            SchoolForManus
          </h1>
          <div className="text-xs font-black text-[#8b6508] dark:text-amber-400 tracking-widest mt-0.5 uppercase">
            School Management System
          </div>
          <p className={`text-xs font-bold mt-1 ${
            isDark ? 'text-slate-400' : 'text-[#5c4015]'
          }`}>
            منصة إدارة المدارس والمؤسسات التعليمية العالمية
          </p>
        </div>

        {/* CENTRAL LOGIN FORM CARD */}
        <div className={`w-full max-w-md border-2 rounded-[32px] p-6 sm:p-8 relative backdrop-blur-md transition-all ${
          isDark 
            ? 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.7)]' 
            : 'bg-gradient-to-b from-[#fdfbf7] via-[#f7ebd4] to-[#ede0c8] border-[#d4af37] text-[#3d2b0f] shadow-[0_25px_60px_rgba(80,50,10,0.3)]'
        }`}>
          
          {/* Top Avatar Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] via-[#b8860b] to-[#78540c] p-1 shadow-lg shadow-[#78540c]/40 flex items-center justify-center -mt-14 mx-auto border-2 border-white dark:border-slate-800">
            <div className={`w-full h-full rounded-full flex items-center justify-center text-[#fef08a] ${
              isDark ? 'bg-slate-950' : 'bg-[#3d2b14]'
            }`}>
              <User className="w-8 h-8" />
            </div>
          </div>

          {/* Title Header */}
          <div className="text-center mt-3 mb-6">
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#3d2b0f]'}`}>
              تسجيل الدخول
            </h2>
            <p className={`text-xs font-bold mt-1 ${isDark ? 'text-amber-200/80' : 'text-[#7a5a29]'}`}>
              أدخل بياناتك المعتمدة للوصول إلى نظامك
            </p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div className="space-y-1">
                    <label htmlFor='login-identifier' className={`text-xs font-black block pr-1 ${isDark ? 'text-amber-300' : 'text-[#5c4015]'}`}>
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div className="relative">
                <input 
                  id='login-identifier'
                  name='identifier'
                  type="text"
                  inputMode="text"
                  autoComplete='username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                  required
                  className={`w-full border text-xs font-bold pr-10 pl-4 py-3 outline-none transition-all shadow-inner ${
                    isDark 
                      ? 'bg-slate-950 border-amber-500/30 text-white placeholder-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20' 
                      : 'bg-[#fdfaf5] border-[#c5a059]/60 hover:border-[#8b6508] focus:border-[#8b6508] text-[#2a1d0f] placeholder-[#a3875a]'
                  }`}
                />
                <span className={`absolute inset-y-0 right-3.5 flex items-center pointer-events-none ${
                  isDark ? 'text-amber-400' : 'text-[#8b6508]'
                }`}>
                  <User className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor='login-password' className={`text-xs font-black block pr-1 ${isDark ? 'text-amber-300' : 'text-[#5c4015]'}`}>
                كلمة المرور
              </label>
              <div className="relative">
                <input 
                  id='login-password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  autoComplete='current-password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className={`w-full border text-xs font-bold pr-10 pl-10 py-3 outline-none transition-all shadow-inner ${
                    isDark 
                      ? 'bg-slate-950 border-amber-500/30 text-white placeholder-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20' 
                      : 'bg-[#fdfaf5] border-[#c5a059]/60 hover:border-[#8b6508] focus:border-[#8b6508] text-[#2a1d0f] placeholder-[#a3875a]'
                  }`}
                />
                <span className={`absolute inset-y-0 right-3.5 flex items-center pointer-events-none ${
                  isDark ? 'text-amber-400' : 'text-[#8b6508]'
                }`}>
                  <LockKeyhole className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 left-3 flex items-center cursor-pointer ${
                    isDark ? 'text-amber-400 hover:text-white' : 'text-[#8b6508] hover:text-[#3d2b0f]'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Trusted identity notice: school, branch, and role are resolved after login. */}
            <div className={`border px-4 py-3 text-xs font-bold leading-relaxed ${
              isDark ? 'border-amber-500/30 bg-amber-950/20 text-amber-200' : 'border-[#c5a059]/50 bg-[#f7ebd4] text-[#5c4015]'
            }`}>
              المدرسة والدور والفرع يتم تحديدها تلقائياً من الهوية الموثوقة بعد التحقق من بيانات الدخول.
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className={`flex items-center gap-2 cursor-pointer font-bold ${
                isDark ? 'text-amber-200' : 'text-[#5c4015]'
              }`}>
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#c5a059] text-[#8b6508] focus:ring-0 cursor-pointer"
                />
                <span>تذكرني</span>
              </label>

              <button 
                type="button"
                onClick={handleForgotPassword}
                className={`font-black underline cursor-pointer ${
                  isDark ? 'text-amber-400 hover:text-amber-300' : 'text-[#8b6508] hover:text-[#3d2b0f]'
                }`}
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {showRecoveryRequest && (
              <div className={`mt-3 border p-4 space-y-3 ${
                isDark ? 'border-amber-500/40 bg-amber-950/20' : 'border-[#c5a059]/60 bg-[#f7ebd4]'
              }`}>
                <div>
                  <p className={`text-sm font-black ${isDark ? 'text-amber-200' : 'text-[#5c4015]'}`}>
                    استعادة كلمة المرور
                  </p>
                  <p className={`mt-1 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-[#6b4b1f]'}`}>
                    أدخل اسم المستخدم أو البريد الإلكتروني المسجل لنرسل لك رابطًا آمنًا لإعادة التعيين.
                  </p>
                </div>
                <input
                  id='recovery-identifier'
                  name='recoveryIdentifier'
                  type="text"
                  inputMode="text"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="اسم المستخدم أو البريد الإلكتروني المسجل"
                  aria-label="اسم المستخدم أو البريد الإلكتروني لاستعادة كلمة المرور"
                  autoComplete="username"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${
                    isDark
                      ? 'border-amber-500/40 bg-slate-900 text-white placeholder-slate-400 focus:border-amber-300'
                      : 'border-[#c5a059]/60 bg-[#fdfaf5] text-[#2a1d0f] placeholder-[#a3875a] focus:border-[#8b6508]'
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isSendingRecovery}
                    className="flex-1 rounded-lg bg-[#8b4513] px-3 py-2.5 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSendingRecovery ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryRequest(false)}
                    disabled={isSendingRecovery}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-black ${
                      isDark ? 'border-amber-500/40 text-amber-200' : 'border-[#c5a059]/60 text-[#5c4015]'
                    }`}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Login Action Button */}
            <div className="pt-3">
              {isLoggingIn ? (
                <div aria-live="polite" className="w-full bg-[#3d2b14] dark:bg-amber-950/80 text-[#fef08a] p-3.5 text-center font-bold text-xs space-y-2 border border-amber-500/40">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#fef08a] animate-ping" />
                    <span>جاري التحقق وتسجيل الدخول...</span>
                  </div>

                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#8b4513] via-[#b86e08] to-[#6d3c05] hover:from-[#a0522d] hover:to-[#824705] text-white font-black text-base shadow-[#6d3c05]/30 border border-[#fef08a]/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-[#fef08a]" />
                  <span>دخول</span>
                </button>
              )}
            </div>

            {/* Security Note at bottom of card */}
            <div className={`pt-2 flex items-center justify-center gap-2 text-[11px] font-extrabold ${
              isDark ? 'text-amber-400/80' : 'text-[#7a5a29]'
            }`}>
              <ShieldCheck className="w-4 h-4 text-[#8b6508] dark:text-amber-400" />
              <span>المصادقة المركزية تحمي جلسة الوصول إلى النظام</span>
            </div>

          </form>

        </div>

      </main>

      {/* BOTTOM FLOATING FEATURE HIGHLIGHTS PANEL */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-4 pb-6 pt-2">
        <div className={`border p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center ${
          isDark 
            ? 'bg-slate-900/90 border-amber-500/30 text-slate-200' 
            : 'bg-gradient-to-r from-[#fdfbf7] via-[#f5e9d4] to-[#fdfbf7] border-[#d4af37]/60'
        }`}>
          
          {/* Feature 1 */}
          <div className="flex flex-col items-center justify-center p-1 space-y-1">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-amber-500/40 text-amber-400' : 'bg-[#ebdcc2] border-[#c5a059] text-[#8b6508]'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#3d2b0f]'}`}>تقارير دقيقة</div>
            <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#7a5a29]'}`}>تقارير فورية وشاملة</div>
          </div>

          {/* Feature 2 */}
          <div className={`flex flex-col items-center justify-center p-1 space-y-1 border-r ${
            isDark ? 'border-amber-500/20' : 'border-[#c5a059]/30'
          }`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-amber-500/40 text-amber-400' : 'bg-[#ebdcc2] border-[#c5a059] text-[#8b6508]'
            }`}>
              <Puzzle className="w-4 h-4" />
            </div>
            <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#3d2b0f]'}`}>إدارة متكاملة</div>
            <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#7a5a29]'}`}>جميع الأقسام في نظام واحد</div>
          </div>

          {/* Feature 3 */}
          <div className={`flex flex-col items-center justify-center p-1 space-y-1 border-r ${
            isDark ? 'border-amber-500/20' : 'border-[#c5a059]/30'
          }`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-amber-500/40 text-amber-400' : 'bg-[#ebdcc2] border-[#c5a059] text-[#8b6508]'
            }`}>
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#3d2b0f]'}`}>سهولة الاستخدام</div>
            <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#7a5a29]'}`}>واجهة بسيطة وسلسة</div>
          </div>

          {/* Feature 4 */}
          <div className={`flex flex-col items-center justify-center p-1 space-y-1 border-r ${
            isDark ? 'border-amber-500/20' : 'border-[#c5a059]/30'
          }`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-amber-500/40 text-amber-400' : 'bg-[#ebdcc2] border-[#c5a059] text-[#8b6508]'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#3d2b0f]'}`}>بيانات آمنة</div>
            <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#7a5a29]'}`}>حماية وخصوصية كاملة</div>
          </div>

          {/* Feature 5 */}
          <div className={`flex flex-col items-center justify-center p-1 space-y-1 border-r col-span-2 sm:col-span-1 ${
            isDark ? 'border-amber-500/20' : 'border-[#c5a059]/30'
          }`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-amber-500/40 text-amber-400' : 'bg-[#ebdcc2] border-[#c5a059] text-[#8b6508]'
            }`}>
              <Headphones className="w-4 h-4" />
            </div>
            <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#3d2b0f]'}`}>دعم مستمر</div>
            <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#7a5a29]'}`}>فريق دعم متخصص</div>
          </div>

        </div>

        {/* COPYRIGHT LINE */}
        <div className={`text-center text-[11px] font-bold mt-3 ${
          isDark ? 'text-slate-400' : 'text-[#5c4015]'
        }`}>
          جميع الحقوق محفوظة © 2026 SchoolForManus School Management System
        </div>
      </footer>

    </div>
  );
}
