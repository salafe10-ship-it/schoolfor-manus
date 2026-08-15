import { Activity, AlertCircle, AlertTriangle, Bell, Calendar, Check, CheckCircle2, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, Eye, FileText, Filter, Globe, Grid, HelpCircle, Info, Palette, Play, Printer, RotateCw, Search, ShieldCheck, Sliders, SlidersHorizontal, Sparkles, Square, Trash2, Type, X, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
interface GovernanceDesignSystemProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

type DesignSystemTab = 'buttons' | 'tables' | 'forms' | 'dialogs' | 'notifications' | 'spacing' | 'typography' | 'icons';

interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  message: string;
}

export default function GovernanceDesignSystem({
  triggerNotification
}: GovernanceDesignSystemProps) {

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<DesignSystemTab>('buttons');
  const [dsRtl, setDsRtl] = useState<boolean>(true);

  // 1. Button specific states
  const [btnState, setBtnState] = useState<'normal' | 'hover' | 'focus' | 'disabled' | 'loading'>('normal');
  const [btnSize, setBtnSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [btnVariant, setBtnVariant] = useState<'primary' | 'secondary' | 'success' | 'danger'>('primary');
  const [btnHasIcon, setBtnHasIcon] = useState<boolean>(true);

  // 2. Table specific states
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableSelectedRows, setTableSelectedRows] = useState<string[]>([]);
  const [tableFilterBranch, setTableFilterBranch] = useState<string>('all');
  const [tablePage, setTablePage] = useState<number>(1);

  const initialTableData = [
    { id: 'S1021', name: 'أحمد محمود الورتاني', role: 'طالب - الصف العاشر', fees: '3,200 د.ل', status: 'paid', date: '2026-07-01', branch: 'tripoli' },
    { id: 'S1022', name: 'سارة عبد الرحمن الصويعي', role: 'طالبة - الصف الحادي عشر', fees: '4,500 د.ل', status: 'pending', date: '2026-07-05', branch: 'benghazi' },
    { id: 'S1023', name: 'عمر المختار الترهوني', role: 'طالب - الصف الثاني عشر', fees: '2,800 د.ل', status: 'paid', date: '2026-07-08', branch: 'tripoli' },
    { id: 'S1024', name: 'يسرى مصطفى بن علي', role: 'طالبة - الصف العاشر', fees: '3,200 د.ل', status: 'unpaid', date: '2026-07-09', branch: 'misrata' },
    { id: 'S1025', name: 'محمود عبد السلام الككلي', role: 'طالب - الصف التاسع', fees: '2,500 د.ل', status: 'paid', date: '2026-07-10', branch: 'benghazi' },
  ];

  // 3. Form specific states
  const [formInputVal, setFormInputVal] = useState<string>('');
  const [formSelectVal, setFormSelectVal] = useState<string>('');
  const [formDateVal, setFormDateVal] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formIsSubmitted, setFormIsSubmitted] = useState<boolean>(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormIsSubmitted(true);
    if (!formInputVal.trim()) {
      setFormError('حقل اسم الطالب مطلوب ولا يمكن تركه فارغاً.');
      triggerNotification('الرجاء تصحيح الأخطاء في النموذج قبل الحفظ', 'danger');
    } else if (formInputVal.length < 5) {
      setFormError('يجب أن يكون اسم الطالب رباعياً (5 أحرف كحد أدنى).');
      triggerNotification('بيانات المدخلات غير صالحة', 'warning');
    } else {
      setFormError(null);
      triggerNotification('تم التحقق من النموذج وحفظ البيانات بنجاح طبقاً لمعايير الـ ERP!', 'success');
    }
  };

  // 4. Dialog specific states
  const [simulatedDialog, setSimulatedDialog] = useState<'confirm' | 'delete' | 'success' | 'error' | 'warning' | null>(null);

  // 5. Notification specific states
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [activeAlertStyle, setActiveAlertStyle] = useState<'success' | 'warning' | 'danger' | 'info'>('info');

  const triggerLocalToast = (message: string, type: 'success' | 'warning' | 'danger' | 'info') => {
    const id = Date.now().toString();
    setToastQueue((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  // 8. Icons states
  const [iconSearch, setIconSearch] = useState<string>('');
  const [iconCategory, setIconCategory] = useState<'all' | 'actions' | 'status' | 'files'>('all');

  const unifiedIconsList = [
    { name: 'Palette', icon: Palette, category: 'actions', desc: 'لوحة الألوان وسمات الواجهات' },
    { name: 'SlidersHorizontal', icon: SlidersHorizontal, category: 'actions', desc: 'خيارات التحكم والتخصيص' },
    { name: 'Globe', icon: Globe, category: 'actions', desc: 'الترجمة وتوافق اللغات RTL' },
    { name: 'CheckCircle2', icon: CheckCircle2, category: 'status', desc: 'حالة النجاح والعمليات المكتملة' },
    { name: 'XCircle', icon: XCircle, category: 'status', desc: 'حالة الأخطاء وحظر المدخلات' },
    { name: 'AlertTriangle', icon: AlertTriangle, category: 'status', desc: 'التنبيهات الوقائية وموازنات الميزانية' },
    { name: 'Info', icon: Info, category: 'status', desc: 'المعلومات العامة وتفاصيل السجلات' },
    { name: 'Printer', icon: Printer, category: 'actions', desc: 'طباعة الفواتير والتقارير المعتمدة' },
    { name: 'Trash2', icon: Trash2, category: 'actions', desc: 'حذف السجلات أو الغاء القيود' },
    { name: 'Calendar', icon: Calendar, category: 'files', desc: 'تواريخ القيود المالية والعمليات' },
    { name: 'FileText', icon: FileText, category: 'files', desc: 'المستندات الدفترية والفواتير' },
    { name: 'Search', icon: Search, category: 'actions', desc: 'البحث الشامل والمتقدم' },
    { name: 'Bell', icon: Bell, category: 'status', desc: 'الإشعارات وتنبيهات التدقيق' },
    { name: 'Activity', icon: Activity, category: 'status', desc: 'مؤشرات الأداء وتحميل الخوادم' },
    { name: 'Type', icon: Type, category: 'files', desc: 'عناصر النصوص وحجم الخطوط' },
    { name: 'Grid', icon: Grid, category: 'files', desc: 'نظام الهوامش والشبكة الموحدة' }
  ];

  const filteredIcons = unifiedIconsList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(iconSearch.toLowerCase()) || item.desc.includes(iconSearch);
    const matchesCategory = iconCategory === 'all' || item.category === iconCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir={dsRtl ? "rtl" : "ltr"}>
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#1e1b4b] to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-start">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">نظام التصميم المؤسسي الموحد</span>
              <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">اعتماد EduPro 100%</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">7.1 توحيد شاشات النظام بـ Design System معتمد</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium max-w-2xl leading-relaxed">
              تأسيس بيئة المكونات الموحدة وتطبيق المعايير الصارمة لشبكة الهوامش والخطوط والظلال والألوان. يتوافق هذا النظام بالكامل مع اتجاه النصوص العربية (RTL) ويغلق الأبواب أمام التنسيقات العشوائية أو التعديلات الفردية غير الموثقة بصرياً.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-indigo-500/15 border border-indigo-500/30 p-4 rounded-2xl shrink-0 min-w-[220px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-black text-indigo-300 block uppercase">حالة توافق نظام التصميم</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>معتمد ومقفل بالكامل</span>
            </span>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Standardized & Enterprise Certified</p>
          </div>
        </div>
      </div>

      {/* Spacing & Align Switcher QuickBar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">شبكة التصميم القياسية نشطة حالياً بجميع المكونات (8px Grid)</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDsRtl(!dsRtl)}
            className={`py-1.5 px-4 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              dsRtl ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>محاكاة الاتجاه: {dsRtl ? 'عربي (RTL)' : 'إنجليزي (LTR)'}</span>
          </button>
        </div>
      </div>

      {/* Main Design System Navigation Tabs */}
      <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1">
        {[
          { id: 'buttons', label: 'الأزرار (Buttons)', icon: Play },
          { id: 'tables', label: 'الجداول (Tables)', icon: FileText },
          { id: 'forms', label: 'النماذج (Forms)', icon: SlidersHorizontal },
          { id: 'dialogs', label: 'المنبثقات (Dialogs)', icon: LayersIcon },
          { id: 'notifications', label: 'التنبيهات (Alerts)', icon: Bell },
          { id: 'spacing', label: 'شبكة الهوامش (Spacing)', icon: Grid },
          { id: 'typography', label: 'الخطوط (Typography)', icon: Type },
          { id: 'icons', label: 'الأيقونات (Icons)', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DesignSystemTab)}
              className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                isSelected 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border-slate-200/50 dark:border-slate-800/80 font-extrabold' 
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents: Dynamic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* RIGHT PANEL: Live Interactive Sandbox (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              <span>مختبر المحاكاة التفاعلي للأبعاد والسمات (Live Sandbox)</span>
            </h3>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 px-2.5 py-1 rounded-md">
              التوافق البصري: معتمد
            </span>
          </div>

          {/* Render Active Sandbox Content */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/60 p-6 rounded-2xl min-h-[300px] flex flex-col justify-center">
            
            {/* 1. BUTTONS TAB SANDBOX */}
            {activeTab === 'buttons' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">الأزرار التفاعلية الموحدة للـ ERP</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto">
                    تم توحيد الأزرار لمنع التباين البصري. الأزرار تطبق دقة انحناء الزوايا والظلال وحالات التحميل مع التمرير.
                  </p>
                </div>

                {/* Live Sandbox Interactive Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-xs text-right">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">نمط الحالة (State)</label>
                    <select 
                      value={btnState} 
                      onChange={(e) => setBtnState(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 font-bold"
                    >
                      <option value="normal">افتراضي (Normal)</option>
                      <option value="hover">تمرير (Hover)</option>
                      <option value="focus">تركيز (Focus/Outline)</option>
                      <option value="disabled">معطل (Disabled)</option>
                      <option value="loading">تحميل (Loading)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">الحجم والمقاس (Size)</label>
                    <select 
                      value={btnSize} 
                      onChange={(e) => setBtnSize(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 font-bold"
                    >
                      <option value="sm">صغير (sm - h-9)</option>
                      <option value="md">متوسط (md - h-11)</option>
                      <option value="lg">كبير (lg - h-12)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">سمة المكون (Variant)</label>
                    <select 
                      value={btnVariant} 
                      onChange={(e) => setBtnVariant(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 font-bold"
                    >
                      <option value="primary">أساسي (Primary - Indigo)</option>
                      <option value="secondary">ثانوي (Secondary - Gray)</option>
                      <option value="success">إتمام (Success - Emerald)</option>
                      <option value="danger">حذف/خطير (Danger - Rose)</option>
                    </select>
                  </div>
                </div>

                {/* Show Icon Switcher */}
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-slate-500 font-bold">تضمين الأيقونات الموحدة في الأزرار</span>
                  <input 
                    type="checkbox" 
                    checked={btnHasIcon} 
                    onChange={(e) => setBtnHasIcon(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Button Renderer */}
                <div className="p-6 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-center min-h-[100px] border border-slate-200/50 dark:border-slate-850">
                  {(() => {
                    // Assemble classes strictly adhering to specified criteria
                    const baseClasses = "font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xs focus:outline-hidden cursor-pointer";
                    
                    let sizeClasses = "h-11 px-5 text-xs sm:text-sm";
                    if (btnSize === 'sm') sizeClasses = "h-9 px-3.5 text-[11px]";
                    if (btnSize === 'lg') sizeClasses = "h-12 px-6 text-sm sm:text-base";

                    let variantClasses = "";
                    if (btnVariant === 'primary') variantClasses = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10";
                    if (btnVariant === 'secondary') variantClasses = "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700";
                    if (btnVariant === 'success') variantClasses = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10";
                    if (btnVariant === 'danger') variantClasses = "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10";

                    let stateClasses = "";
                    if (btnState === 'hover') {
                      stateClasses = "scale-[1.02] -translate-y-0.5 ring-2 ring-indigo-500/10";
                    } else if (btnState === 'focus') {
                      stateClasses = "ring-4 ring-indigo-500/30 dark:ring-indigo-500/50";
                    } else if (btnState === 'disabled') {
                      stateClasses = "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 hover:bg-slate-200 border-none shadow-none scale-100 pointer-events-none";
                    } else if (btnState === 'loading') {
                      stateClasses = "cursor-wait opacity-85";
                    }

                    return (
                      <button
                        type="button"
                        disabled={btnState === 'disabled'}
                        onClick={() => triggerLocalToast(`تم النقر على زر الإجراء (${btnVariant})!`, 'info')}
                        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${stateClasses}`}
                      >
                        {btnState === 'loading' && <RotateCw className="w-4 h-4 animate-spin text-current" />}
                        {btnState !== 'loading' && btnHasIcon && (
                          btnVariant === 'danger' ? <Trash2 className="w-4 h-4 text-current" /> :
                          btnVariant === 'success' ? <CheckCircle2 className="w-4 h-4 text-current" /> :
                          <Play className="w-4 h-4 text-current" />
                        )}
                        <span>
                          {btnState === 'loading' ? 'جاري المعالجة والترحيل...' : 
                           btnVariant === 'danger' ? 'حذف القيد المالي' : 
                           btnVariant === 'success' ? 'اعتماد التقرير المالي' : 'إجراء نظام التصميم'}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 2. TABLES TAB SANDBOX */}
            {activeTab === 'tables' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex gap-2">
                    <div className="relative w-full sm:w-56">
                      <input 
                        type="text" 
                        placeholder="بحث سريع في الجدول الموحد..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 pl-8 text-xs focus:outline-hidden text-right font-semibold"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    <select
                      value={tableFilterBranch}
                      onChange={(e) => setTableFilterBranch(e.target.value)}
                      className="h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="all">كل الفروع</option>
                      <option value="tripoli">طرابلس</option>
                      <option value="benghazi">بنغازي</option>
                      <option value="misrata">مصراتة</option>
                    </select>
                  </div>
                  <h4 className="text-xs font-black text-slate-500">الجداول المحاسبية والطلابية الموحدة</h4>
                </div>

                {/* Unified Table Structure */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="h-12 bg-slate-50/80 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 text-right w-12">
                          <button
                            type="button"
                            onClick={() => {
                              if (tableSelectedRows.length === initialTableData.length) {
                                setTableSelectedRows([]);
                              } else {
                                setTableSelectedRows(initialTableData.map(r => r.id));
                              }
                            }}
                            className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            {tableSelectedRows.length === initialTableData.length ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 text-right">رقم القيد</th>
                        <th className="px-4 text-right">الاسم الكامل للطالب</th>
                        <th className="px-4 text-right">الفئة والمستوى الدراسي</th>
                        <th className="px-4 text-center">الفرع</th>
                        <th className="px-4 text-left">الرسوم المستحقة</th>
                        <th className="px-4 text-center">حالة السداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {initialTableData
                        .filter(row => {
                          const matchesSearch = row.name.includes(tableSearch) || row.id.includes(tableSearch);
                          const matchesBranch = tableFilterBranch === 'all' || row.branch === tableFilterBranch;
                          return matchesSearch && matchesBranch;
                        })
                        .map((row, idx) => {
                          const isSelected = tableSelectedRows.includes(row.id);
                          // Zebra row styling: alternate bg-white & bg-slate-50/40
                          const rowBg = idx % 2 === 0 
                            ? (isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'bg-white dark:bg-slate-900') 
                            : (isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'bg-slate-50/30 dark:bg-slate-850/20');

                          return (
                            <tr 
                              key={row.id} 
                              onClick={() => {
                                setTableSelectedRows(prev => 
                                  prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]
                                );
                              }}
                              className={`h-14 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/40 cursor-pointer ${rowBg}`}
                            >
                              <td className="px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTableSelectedRows(prev => 
                                      prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]
                                    );
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 font-mono text-[11px] text-slate-400 font-bold">{row.id}</td>
                              <td className="px-4 font-black text-slate-900 dark:text-white">{row.name}</td>
                              <td className="px-4 font-bold text-slate-500">{row.role}</td>
                              <td className="px-4 text-center font-bold">
                                {row.branch === 'tripoli' ? 'طرابلس' : row.branch === 'benghazi' ? 'بنغازي' : 'مصراتة'}
                              </td>
                              <td className="px-4 text-left font-mono font-bold text-slate-900 dark:text-white" dir="ltr">{row.fees}</td>
                              <td className="px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${
                                  row.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' :
                                  row.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' :
                                  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40'
                                }`}>
                                  {row.status === 'paid' ? '✓ مسدد بالكامل' : row.status === 'pending' ? '⚠️ قيد المراجعة' : '✗ غير مسدد'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Standardized Pagination Footer */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-xs">
                  <span className="text-slate-400 font-bold">إجمالي المختار: {tableSelectedRows.length} سجل</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="px-3 font-bold">الصفحة {tablePage} من 3</span>
                    <button 
                      onClick={() => setTablePage(p => Math.min(3, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-slate-500 font-bold">يعرض 5 من أصل 15 قيد</span>
                </div>
              </div>
            )}

            {/* 3. FORMS TAB SANDBOX */}
            {activeTab === 'forms' && (
              <form onSubmit={handleFormSubmit} className="space-y-5 text-right">
                <div className="text-center space-y-1 mb-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">النماذج وحقول الإدخال القياسية</h4>
                  <p className="text-[11px] text-slate-400">تطبيق معايير الارتفاع الموحد h-11 مع الملصقات ومؤشرات الحقول المطلوبة.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Field 1: Input text with label and validation state */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-start">
                      <span className="text-rose-500 ml-1 font-bold">*</span>
                      <span>الاسم الرباعي للطالب</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="أدخل الاسم رباعياً طبقاً لشهادة الميلاد..."
                      value={formInputVal}
                      onChange={(e) => {
                        setFormInputVal(e.target.value);
                        if (formIsSubmitted) setFormError(null);
                      }}
                      className={`w-full h-11 px-3.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border transition-all text-right focus:outline-hidden focus:ring-2 ${
                        formError 
                          ? 'border-rose-500 focus:ring-rose-500/20 ring-2 ring-rose-500/10' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                    />
                    {formError && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 justify-start">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formError}</span>
                      </p>
                    )}
                  </div>

                  {/* Field 2: Dropdown custom list */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                      المرحلة والفرع الأكاديمي
                    </label>
                    <div className="relative">
                      <select 
                        value={formSelectVal}
                        onChange={(e) => setFormSelectVal(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all text-right focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                      >
                        <option value="">-- يرجى اختيار الفرع والمستوى --</option>
                        <option value="1">الصف العاشر - فرع طرابلس</option>
                        <option value="2">الصف الحادي عشر - فرع بنغازي</option>
                        <option value="3">الصف الثاني عشر - فرع مصراتة</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Field 3: Date Picker */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                      تاريخ بدء القيد والتسجيل
                    </label>
                    <div className="relative">
                      <input 
                        type="date"
                        value={formDateVal}
                        onChange={(e) => setFormDateVal(e.target.value)}
                        className="w-full h-11 px-3.5 pl-10 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormInputVal('');
                      setFormSelectVal('');
                      setFormDateVal('');
                      setFormError(null);
                      setFormIsSubmitted(false);
                    }}
                    className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-black transition-all cursor-pointer"
                  >
                    إعادة تعيين النموذج
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ بيانات الطالب والتحقق </span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. DIALOGS TAB SANDBOX */}
            {activeTab === 'dialogs' && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">صندوق محاكاة النوافذ المنبثقة القياسية الخمسة (Unified Dialogs)</h4>
                  <p className="text-[11px] text-slate-400">انقر على أحد النوافذ لمعاينة المظهر الموحد للحوارات والتحذيرات والعمليات المالية والادارية.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'confirm', label: 'تأكيد ترحيل (Confirm)', color: 'bg-indigo-600 text-white' },
                    { id: 'delete', label: 'حذف سجل (Delete)', color: 'bg-rose-600 text-white' },
                    { id: 'success', label: 'إشعار نجاح (Success)', color: 'bg-emerald-600 text-white' },
                    { id: 'error', label: 'فشل العملية (Error)', color: 'bg-rose-100 text-rose-800 border border-rose-300' },
                    { id: 'warning', label: 'تنبيه تدقيق (Warning)', color: 'bg-amber-500 text-slate-950' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSimulatedDialog(d.id as any)}
                      className={`p-3 rounded-xl text-xs font-black transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer ${d.color}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Dialog Mock Window Simulator inside Sandbox Container */}
                {simulatedDialog && (
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 max-w-md mx-auto text-right animate-fade-in relative">
                    <button
                      type="button"
                      onClick={() => setSimulatedDialog(null)}
                      className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {simulatedDialog === 'confirm' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <SlidersHorizontal className="w-5 h-5" />
                          <h5 className="font-black text-sm">هل أنت متأكد من ترحيل القيود اليومية الصفرية؟</h5>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          بموجب عملية الترحيل، سيتم تحديث رصيد الحساب العام لكل مركز تكلفة مرتبط بالفرع المحدد بصورة دائمة وغير قابلة للتراجع دون موافقة الإدارة المالية.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setSimulatedDialog(null)} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200">إلغاء الأمر</button>
                          <button type="button" onClick={() => { setSimulatedDialog(null); triggerNotification('تم ترحيل قيود اليومية بنجاح!', 'success'); }} className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">تأكيد وترحيل الآن ✓</button>
                        </div>
                      </div>
                    )}

                    {simulatedDialog === 'delete' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-rose-600">
                          <Trash2 className="w-5 h-5 animate-bounce" />
                          <h5 className="font-black text-sm">تأكيد حذف ملف الطالب بصورة نهائية؟</h5>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          تحذير: سيؤدي حذف ملف الطالب إلى محو كافة السجلات الدراسية التاريخية، الكشوفات، وأرشيف الغياب والحضور المتصل بالرقم الوطني فوراً.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setSimulatedDialog(null)} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200">إلغاء</button>
                          <button type="button" onClick={() => { setSimulatedDialog(null); triggerNotification('تم حذف الملف بصورة كاملة.', 'danger'); }} className="h-9 px-4 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">نعم، تأكيد الحذف والمحو</button>
                        </div>
                      </div>
                    )}

                    {simulatedDialog === 'success' && (
                      <div className="space-y-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h5 className="font-black text-sm text-emerald-700 dark:text-emerald-400">تم ترحيل الفواتير بنجاح</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          قام النظام بمزامنة 124 دفعة مالية مع ميزان المراجعة وتوليد سندات الصرف التلقائية وإرسال إشعارات SMS فورية لأولياء الأمور.
                        </p>
                        <button type="button" onClick={() => setSimulatedDialog(null)} className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">العودة للوحة التحكم</button>
                      </div>
                    )}

                    {simulatedDialog === 'error' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-rose-600">
                          <XCircle className="w-5 h-5" />
                          <h5 className="font-black text-sm">فشل مطابقة قواعد التدقيق المالي</h5>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          رصيد المدين (4,500 د.ل) لا يتطابق مع رصيد الدائن (4,200 د.ل). يرجى موازنة القيد وتسوية الفارق (300 د.ل) قبل الإغلاق.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setSimulatedDialog(null)} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200">إغلاق</button>
                          <button type="button" onClick={() => setSimulatedDialog('confirm')} className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">تعديل القيد الآن</button>
                        </div>
                      </div>
                    )}

                    {simulatedDialog === 'warning' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="w-5 h-5 animate-pulse" />
                          <h5 className="font-black text-sm text-amber-800 dark:text-amber-400">تجاوز السقف الائتماني لرسوم الطالب</h5>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          الطالب سارة لديه مستحقات سابقة من العام الماضي تتجاوز السقف المسموح به (1,500 د.ل). تسجيل هذا القيد يتطلب موافقة المراقب المالي للفرع.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setSimulatedDialog(null)} className="h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 font-black">حفظ كمسودة مؤقتة</button>
                          <button type="button" onClick={() => { setSimulatedDialog(null); triggerNotification('تم إرسال طلب تجاوز السقف للمراقب المالي', 'warning'); }} className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black">طلب استثناء طارئ</button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* 5. NOTIFICATIONS TAB SANDBOX */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">التنبيهات الفورية وإشعارات النظام (Toasts & Alerts)</h4>
                  <p className="text-[11px] text-slate-400">توحيد المظهر البصري لرسائل النجاح والأخطاء والتحذيرات بجميع الواجهات.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 text-xs font-semibold">
                  <button 
                    onClick={() => triggerLocalToast('تمت المزامنة بنجاح وحفظ السجل!', 'success')}
                    className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-center text-[11px] font-black cursor-pointer hover:bg-emerald-100/50"
                  >
                    توليد إشعار نجاح (Success Toast)
                  </button>
                  <button 
                    onClick={() => triggerLocalToast('فشل في الوصول لخادم قاعدة البيانات للفرع', 'danger')}
                    className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-center text-[11px] font-black cursor-pointer hover:bg-rose-100/50"
                  >
                    توليد إشعار خطأ (Error Toast)
                  </button>
                  <button 
                    onClick={() => triggerLocalToast('تنبيه: يجب إدخال الرقم الوطني للتحقق', 'warning')}
                    className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-center text-[11px] font-black cursor-pointer hover:bg-amber-100/50"
                  >
                    توليد تحذير (Warning Toast)
                  </button>
                  <button 
                    onClick={() => triggerLocalToast('ملاحظة: تم ترقية لوحة الإشعارات بنجاح', 'info')}
                    className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-center text-[11px] font-black cursor-pointer hover:bg-blue-100/50"
                  >
                    توليد معلومة (Info Toast)
                  </button>
                </div>

                {/* Simulated Floating Toast Container */}
                <div className="relative min-h-[120px] bg-slate-100 dark:bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center border border-dashed border-slate-300">
                  <span className="text-[10px] text-slate-400 absolute top-2 right-2 font-bold">صندوق معاينة الإشعارات العائمة</span>
                  {toastQueue.length === 0 ? (
                    <span className="text-[11px] text-slate-400 font-bold">انقر على الأزرار في الأعلى لمعاينة الإشعار العائم (Toast)</span>
                  ) : (
                    <div className="space-y-2 w-full max-w-sm">
                      {toastQueue.map((toast) => (
                        <div 
                          key={toast.id}
                          className={`p-3 rounded-xl shadow-md border flex items-center justify-between gap-3 text-right animate-fade-in ${
                            toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
                            toast.type === 'danger' ? 'bg-rose-600 text-white border-rose-500' :
                            toast.type === 'warning' ? 'bg-amber-500 text-slate-950 border-amber-400' :
                            'bg-slate-900 text-white border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            {toast.type === 'danger' && <XCircle className="w-4 h-4 shrink-0" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
                            <span className="text-xs font-black">{toast.message}</span>
                          </div>
                          <button 
                            onClick={() => setToastQueue(q => q.filter(t => t.id !== toast.id))}
                            className="p-1 rounded hover:bg-black/10 text-current"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Standardized Inline Alerts Selector */}
                <div className="space-y-3 text-right">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">
                      {(['success', 'warning', 'danger', 'info'] as const).map((sty) => (
                        <button
                          key={sty}
                          type="button"
                          onClick={() => setActiveAlertStyle(sty)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black cursor-pointer transition-all ${
                            activeAlertStyle === sty ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200'
                          }`}
                        >
                          {sty === 'success' ? 'نجاح' : sty === 'warning' ? 'تحذير' : sty === 'danger' ? 'خطأ' : 'معلومة'}
                        </button>
                      ))}
                    </div>
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-300">التنبيهات المضمنة بالصفحة (Inline Alerts)</h5>
                  </div>

                  {activeAlertStyle === 'success' && (
                    <div className="bg-emerald-50/75 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                      <div className="text-right">
                        <span className="font-black text-xs block">موازنة الحسابات معتمدة وقانونية ✅</span>
                        <p className="text-[10.5px] mt-0.5 leading-relaxed font-semibold">تطابق الحسابات المتقاطعة بنسبة 100% مع ميزان المراجعة السنوي ولا توجد متبقيات معلقة.</p>
                      </div>
                    </div>
                  )}

                  {activeAlertStyle === 'warning' && (
                    <div className="bg-amber-50/75 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <div className="text-right">
                        <span className="font-black text-xs block">تنبيه قواعد المطابقة والتدقيق ⚠️</span>
                        <p className="text-[10.5px] mt-0.5 leading-relaxed font-semibold">يجب استيفاء توقيع المفوض المالي قبل ترحيل الفواتير التي تتجاوز قيمتها 10,000 د.ل.</p>
                      </div>
                    </div>
                  )}

                  {activeAlertStyle === 'danger' && (
                    <div className="bg-rose-50/75 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-400">
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                      <div className="text-right">
                        <span className="font-black text-xs block">خطأ في جلب بيانات الفواتير النشطة ✗</span>
                        <p className="text-[10.5px] mt-0.5 leading-relaxed font-semibold">رقم قيد الطالب المدخل غير متوافق مع قاعدة بيانات فرع بنغازي. يرجى مراجعة الرقم الوطني.</p>
                      </div>
                    </div>
                  )}

                  {activeAlertStyle === 'info' && (
                    <div className="bg-blue-50/75 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-4 rounded-xl flex items-start gap-2.5 text-blue-800 dark:text-blue-400">
                      <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                      <div className="text-right">
                        <span className="font-black text-xs block">تحديث جديد لنظام معايير الفهرسة</span>
                        <p className="text-[10.5px] mt-0.5 leading-relaxed font-semibold">تم تحديث هذا الدليل مع المظهر العام لتطبيق الهوامش والمساحات القياسية لـ EduPro.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. SPACING SYSTEM TAB SANDBOX */}
            {activeTab === 'spacing' && (
              <div className="space-y-6 text-right">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">شبكة الهوامش والمسافات المعتمدة (Spacing Ruler)</h4>
                  <p className="text-[11px] text-slate-400">شبكة معايير مريحة تمنع تماماً المساحات العشوائية.</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { label: '4px (ميكرو-مسافة - Padding / Gap دقيق جداً)', val: 'w-1', px: '4px', desc: 'للأيقونات والنصوص الملاصقة' },
                    { label: '8px (المسافة الأساسية - Gap)', val: 'w-2', px: '8px', desc: 'للمسافة بين حقول الإدخال والأزرار' },
                    { label: '12px (المسافة المريحة - Comfort)', val: 'w-3', px: '12px', desc: 'للهوامش المباشرة والأقسام الصغيرة' },
                    { label: '16px (الهامش القياسي - Standard Gap)', val: 'w-4', px: '16px', desc: 'للمسافات بين المكونات التفاعلية' },
                    { label: '24px (الهامش المتوسط - Medium)', val: 'w-6', px: '24px', desc: 'للهوامش الداخلية للبطاقات ومجموعات الحقول' },
                    { label: '32px (الهامش الكبير - Large)', val: 'w-8', px: '32px', desc: 'للمسافة بين الأقسام الكبيرة وعناوين الصفحات' },
                    { label: '48px (الهامش العريض - Extra Large)', val: 'w-12', px: '48px', desc: 'لهامش الصفحة الخارجي والمسافات الصفرية' },
                  ].map((sp, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                      <div className="text-right">
                        <span className="font-black text-xs text-slate-800 dark:text-slate-200 block">{sp.label}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">{sp.desc}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">{sp.px}</span>
                        <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-md h-4 overflow-hidden flex justify-end">
                          <div className="h-full bg-indigo-600 rounded-l" style={{ width: sp.px }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. TYPOGRAPHY TAB SANDBOX */}
            {activeTab === 'typography' && (
              <div className="space-y-6 text-right">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">الخطوط والطباعة القياسية</h4>
                  <p className="text-[11px] text-slate-400">تطبيق خط "Inter" للشاشات المقترنة بقواعد عرض عناوين الـ ERP.</p>
                </div>

                <div className="border border-slate-150 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-5 text-right">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase mb-1">عناوين الصفحات القياسية (Page Titles)</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">عناوين الصفحات الرئيسية بالـ ERP (32px / font-black)</h1>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase mb-1">عناوين الأقسام (Section Headers)</span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">عناوين الأقسام الفرعية والبطاقات (20px / font-extrabold)</h3>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase mb-1">النصوص العامة وقيم الحقول (Body Text)</span>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                      النصوص التوضيحية وشرح الخطوات والتنبيهات المضمنة بداخل الخلايا والمستندات (14px / font-semibold / text-slate-600).
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase mb-1">نصوص الجداول والبيانات الدفترية (Table & Ledger Texts)</span>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                      #JV-10024 | أحمد محمود الصويعي | 3,200 د.ل (12px / font-medium / text-slate-700).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. ICONS TAB SANDBOX */}
            {activeTab === 'icons' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex gap-2">
                    <div className="relative w-full sm:w-56">
                      <input 
                        type="text" 
                        placeholder="ابحث عن أيقونة معتمدة..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 pl-8 text-xs focus:outline-hidden text-right font-semibold"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    <select
                      value={iconCategory}
                      onChange={(e) => setIconCategory(e.target.value as any)}
                      className="h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="all">كل الفئات</option>
                      <option value="actions">إجراءات (Actions)</option>
                      <option value="status">حالات (Status)</option>
                      <option value="files">ملفات وأبعاد (Files)</option>
                    </select>
                  </div>
                  <h4 className="text-xs font-black text-slate-500">مكتبة الأيقونات الموحدة (Lucide)</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filteredIcons.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          triggerNotification(`تم اختيار أيقونة ${item.name} بنجاح!`, 'info');
                          triggerLocalToast(`أيقونة ${item.name} مطابقة وموثقة لـ EduPro.`, 'success');
                        }}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:border-indigo-500 dark:hover:border-indigo-500 hover:scale-[1.03] transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-850 text-indigo-600 dark:text-indigo-400">
                          <Icon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold leading-tight">{item.desc}</span>
                      </div>
                    );
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 font-bold">لا توجد أيقونة تطابق استعلامك.</div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* LEFT PANEL: Certification & Specs (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 text-right">
          <h3 className="text-base font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            أدلة وقواعد التنسيق المؤسسي (Visual Specs)
          </h3>

          <div className="space-y-4 text-xs font-semibold">
            {/* Standard Specifications for each of the 8 items */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">أولاً: الأزرار (Buttons)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                الارتفاع: sm (36px), md (44px), lg (48px). الحواف: دائرية بمعدل 12px. التأثير البصري المريح عند التمرير والضغط والتحميل.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">ثانياً: الجداول (Tables)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                ارتفاع الرأس: 48px, الصفوف: 56px لتقليص الضغط البصري. خطوط تبادلية (Zebra) مع تمييز دقيق للصفوف المحددة.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">ثالثاً: النماذج (Forms)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                الارتفاع: 44px (h-11). حقول الإدخال والتواريخ والخيارات تتبع نفس التنسيق. إظهار رسائل التحقق والمؤشر الأحمر للضرورة.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">رابعاً: النوافذ المنبثقة (Dialogs)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                نوافذ التأكيد والحذف والنجاح والفشل والتحذير مغلفة جميعاً بظل ناعم وخلفية ضبابية لزيادة التركيز.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">خامساً: الإشعارات والتنبيهات</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                توحيد التنبيهات والرسائل التحذيرية العائمة أو المضمنة. ألوان واضحة: أخضر للنجاح، أحمر للخطأ، برتقالي للتحذير.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">سادساً: نظام المسافات (Spacing)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                اعتماد مسافات متضاعفة للـ 4px والـ 8px لمنع تشوه العناصر وتوجيه المحاذاة.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-1.5 justify-end text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="font-black">سابعاً وثامناً: الخطوط والأيقونات</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                عناوين بنقش غامق Inter. الأيقونات مستوردة من Lucide-react فقط لمنع تعارض الأنماط.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Certification Approval Stamp & Export Controls */}
      <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center flex flex-col items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full border border-dashed border-indigo-500/10 flex items-center justify-center pointer-events-none select-none">
          <span className="text-indigo-500/10 text-4xl font-black rotate-12">نظام التصميم المعتمد</span>
        </div>

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="w-20 h-20 bg-indigo-500/15 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/30 shadow-lg shadow-indigo-500/5 animate-pulse">
            <Palette className="w-12 h-12 text-pink-400" />
          </div>
          
          <span className="text-xs font-black text-pink-400 block uppercase tracking-widest">المرحلة السابعة • وثيقة تأسيس واعتماد نظام التصميم المؤسسي لـ EduPro</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">اعتماد نظام التصميم كمرجع موحد لجميع الوحدات</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto">
            بموجب هذا القرار التقني، نعلن إتمام حصر المكونات، وصياغة المعايير البصرية التفاعلية الموحدة، والتأكد من توافق اتجاه النصوص العربية بالكامل. يتم اعتماد **نظام التصميم (Design System)** هذا كالمرجع الوحيد لجميع واجهات ومكونات المنصة والأنظمة الفرعية التابعة للمؤسسة.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerNotification('تم توثيق وتأمين نظام التصميم المؤسسي بنجاح كمرجع وحيد للمنصة!', 'success');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد اعتماد وحفظ نظام التصميم الموحد ✓</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              <span>تصدير دليل معايير التفاعل والأبعاد 📄</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal fallback inline icon component if lucide-react changes
function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-10 5 10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}
