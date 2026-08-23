import { Download, Edit3, FileSpreadsheet, FileText, Home, Loader2, LogOut, Plus, Printer, RefreshCw, Save, Search, Trash2, Upload, X } from 'lucide-react';
import React from 'react';
interface EnterpriseActionToolbarProps {
  title?: string;
  stats?: React.ReactNode;
  
  // Handlers
  onNew?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onDownloadTemplate?: () => void;
  onExit?: () => void;

  // Loading States
  isSaving?: boolean;
  isLoading?: boolean;

  // Active / Selection States to disable/enable certain actions
  selectedId?: string | boolean | null;
  isEditing?: boolean;
  userRole?: string;
  minimal?: boolean;
}

export default function EnterpriseActionToolbar({
  title = 'شؤون الطلاب',
  stats,
  onNew,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  onRefresh,
  onSearch,
  onPrint,
  onExportPdf,
  onExportExcel,
  onImportExcel,
  onDownloadTemplate,
  onExit,
  isSaving = false,
  isLoading = false,
  selectedId = null,
  isEditing = false,
  userRole = 'SuperAdmin',
  minimal = true
}: EnterpriseActionToolbarProps) {
  
  // Permissions matching the organizational rules
  const canEdit = userRole === 'SuperAdmin' || userRole === 'SchoolAdmin';
  const canDelete = userRole === 'SuperAdmin';
  const canExport = userRole !== 'Parent';

  // Helper styling for consistent layout of all actions
  const buttonHeight = 'h-[34px]';
  const commonStyles = `inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-black transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 select-none ${buttonHeight} px-3 bg-[#2a1d13] text-amber-100 border border-[#d4af37]/40 hover:bg-[#38271a] hover:border-[#f7d174] hover:text-[#fce79a] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] cursor-pointer`;

  // Subtitles dictionary for compact enterprise header mapping
  const subtitleMap: Record<string, string> = {
    'شؤون الطلاب': 'إدارة التسجيل، الشُّعب الدراسية، والملفات الأكاديمية للطلاب',
    'الحسابات العامة والرقابة المالية': 'مراقبة القيود المزدوجة، شجرة الحسابات، الدليل الموحد والميزانية',
    'الرسوم والأقساط المدرسية': 'إدارة الخطط المالية، المدفوعات، الفواتير وجدولة الأقساط',
    'الامتحانات والنتائج والكنترول': 'تنظيم لجان الامتحانات، رصد الدرجات، واستخراج الشهادات المعتمدة',
    'شؤون المعلمين والموظفين': 'إدارة الكادر التعليمي، الرواتب والمسيرات، الحضور والإجازات',
    'إدارة الزي والملابس المدرسية': 'رقابة المخازن وحركة مبيعات الزي والملابس المدرسية',
    'إدارة المكتبة المدرسية المركزية': 'فهرسة الكتب والمراجع، وإدارة الإعارات النشطة والغرامات',
    'مستودعات المناهج والعهدة المدرسية': 'متابعة حركة الكتب الدراسية والعهدة العينية للمدرسة',
    'إدارة باصات النقل والمواصلات المدرسية': 'تنظيم خطوط السير والمشرفين للأسطول المدرسي',
  };

  const subtitle = subtitleMap[title] || 'لوحة الإجراءات المتكاملة لنظام إدارة المدرسة';

  return (
    <div className={`enterprise-action-toolbar bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden z-30 ${minimal ? 'mb-4' : 'mb-6'}`}>
      <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />
      {/* Right Section: Compact Title and KPI Stats */}
      {!minimal && (
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="space-y-0.5">
            <h1 className="text-sm sm:text-base font-black tracking-tight text-[#fce79a] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f7d174] animate-pulse"></span>
              {title}
            </h1>
            <p className="text-[10px] text-amber-200/70 font-medium">{subtitle}</p>
          </div>
          {stats && (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-amber-100 bg-[#2a1d13] border border-[#d4af37]/30 px-3 py-1 rounded-lg shadow-inner">
              {stats}
            </div>
          )}
        </div>
      )}

      {/* Middle/Left Section: Unified Single-Row Action Controls (RTL Flow) */}
      <div className={`flex flex-wrap items-center gap-2 max-sm:w-full overflow-x-auto scrollbar-none py-0.5 ${minimal ? 'w-full justify-between sm:justify-start' : ''}`}>
        
        <div className="flex flex-wrap items-center bg-[#130b04] border border-[#d4af37]/30 p-1 gap-1 shadow-inner">
          {/* 1. جديد */}
          {onNew && (
            <button
              type="button"
              onClick={onNew}
              disabled={isLoading || isEditing || !canEdit}
              className={`${commonStyles} bg-gradient-to-r from-[#9a6a1d] to-[#c58a22] text-amber-950 hover:from-[#b07d25] hover:to-[#da9f2c] border-[#fce79a]/50`}
              title="إضافة سجل جديد"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>جديد</span>
            </button>
          )}

          {/* 2. تعديل */}
          {!isEditing && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={isLoading || !canEdit || !selectedId}
              className={commonStyles}
              title="تعديل السجل المحدد"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span>تعديل</span>
            </button>
          )}

          {/* 3. حذف */}
          {!isEditing && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isLoading || !canDelete || !selectedId}
              className={`${commonStyles} hover:text-rose-300 hover:border-rose-600/50 hover:bg-rose-950/40`}
              title="حذف السجل المحدد"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>حذف</span>
            </button>
          )}

          {/* 4. حفظ */}
          {isEditing && onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isLoading || isSaving}
              className={`${commonStyles} bg-gradient-to-r from-[#d4af37] to-[#f7d174] text-slate-950 border-[#fce79a] hover:brightness-110`}
              title="حفظ التغييرات"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Save className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isSaving ? 'جاري الحفظ' : 'حفظ'}</span>
            </button>
          )}

          {/* 4.5. إلغاء */}
          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading || isSaving}
              className={commonStyles}
              title="إلغاء التعديل"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              <span>إلغاء</span>
            </button>
          )}

          {/* 5. تحديث */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading || isEditing}
              className={commonStyles}
              title="تحديث البيانات"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>تحديث</span>
            </button>
          )}

          {/* 6. بحث */}
          {onSearch && (
            <button
              type="button"
              onClick={onSearch}
              className={commonStyles}
              title="بحث وتصفية"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>بحث</span>
            </button>
          )}

          {/* Separator inside row to organize export tools */}
          {(onPrint || onExportPdf || onExportExcel) && canExport && !isEditing && (
            <div className="h-5 w-px bg-[#d4af37]/30 mx-1 self-center hidden sm:block"></div>
          )}

          {/* 7. طباعة */}
          {onPrint && canExport && !isEditing && (
            <button
              type="button"
              onClick={onPrint}
              disabled={isLoading}
              className={commonStyles}
              title="طباعة التقرير"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>طباعة</span>
            </button>
          )}

          {/* 8. PDF */}
          {onExportPdf && canExport && !isEditing && (
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isLoading}
              className={commonStyles}
              title="تصدير بصيغة PDF"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>PDF</span>
            </button>
          )}

          {/* 9. Excel */}
          {onExportExcel && canExport && !isEditing && (
            <button
              type="button"
              onClick={onExportExcel}
              disabled={isLoading}
              className={commonStyles}
              title="تصدير بصيغة Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Excel</span>
            </button>
          )}
          
          {/* 9.5 Import / Template */}
          {(onImportExcel || onDownloadTemplate) && canExport && !isEditing && (
            <div className="h-5 w-px bg-[#d4af37]/30 mx-1 self-center hidden sm:block"></div>
          )}

          {onImportExcel && canExport && !isEditing && (
            <button
              type="button"
              onClick={onImportExcel}
              disabled={isLoading}
              className={commonStyles}
              title="استيراد بيانات"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>استيراد</span>
            </button>
          )}

          {onDownloadTemplate && canExport && !isEditing && (
            <button
              type="button"
              onClick={onDownloadTemplate}
              disabled={isLoading}
              className={commonStyles}
              title="تحميل قالب"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>قالب</span>
            </button>
          )}
        </div>

        {/* 11. العودة للرئيسية */}
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-black h-[34px] px-3 shadow-md bg-gradient-to-r from-[#9a6a1d] via-[#c58a22] to-[#8b6113] border border-[#f7d174]/50 text-[#fff8d6] hover:brightness-110 select-none transition-all cursor-pointer active:scale-95"
            title="العودة للرئيسية"
          >
            <Home className="w-3.5 h-3.5 shrink-0 text-[#fce79a]" />
            <span>العودة للرئيسية</span>
          </button>
        )}

        {/* Minimal Operational context tag */}
        {minimal && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#2a1d13] rounded-lg text-[10px] font-black text-amber-200/80 border border-[#d4af37]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>بوابة التشغيل النشطة: {title}</span>
          </div>
        )}

      </div>
    </div>
  );
}
