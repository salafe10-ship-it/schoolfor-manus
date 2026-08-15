import { BookOpen, CheckSquare, Download, FileSpreadsheet, FileText, Printer, RefreshCw, Save, Trash2, Upload, UserPlus, X } from 'lucide-react';
import React from 'react';
import EnterpriseButton from '../shared/EnterpriseButton';

interface StudentAffairsHeaderProps {
  filteredListCount: number;
  activeStatusCount: number;
  handleNewRecordInit: () => void;
  handleSaveStudent: () => void;
  handleEditStudent: () => void;
  handleCancel: () => void;
  handleDeleteStudent: () => void;
  handleRefresh: () => void;
  handlePrint: () => void;
  handleExportPdf: () => void;
  handleExportExcel: () => void;
  handleImportExcel: () => void;
  handleDownloadTemplate: () => void;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  selectedStudentId: string;
  userRole: 'SuperAdmin' | 'SchoolAdmin' | 'Teacher' | 'Accountant' | 'Parent';
}

export default function StudentAffairsHeader({
  filteredListCount,
  activeStatusCount,
  handleNewRecordInit,
  handleSaveStudent,
  handleEditStudent,
  handleCancel,
  handleDeleteStudent,
  handleRefresh,
  handlePrint,
  handleExportPdf,
  handleExportExcel,
  handleImportExcel,
  handleDownloadTemplate,
  isLoading,
  isSaving,
  isEditing,
  selectedStudentId,
  userRole
}: StudentAffairsHeaderProps) {
  const canEdit = userRole === 'SuperAdmin' || userRole === 'SchoolAdmin';
  const canDelete = userRole === 'SuperAdmin';
  const canExport = userRole !== 'Parent';

  return (
    <div className="border-b border-slate-200 p-2 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-600" />
          شؤون الطلاب
        </h1>
        {/* KPI Chips */}
        <div className="flex gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
          <span>الطلاب: {filteredListCount}</span>
          <span>|</span>
          <span>نشط: {activeStatusCount}</span>
        </div>
      </div>

      {/* Toolbar Operations */}
      <div className="flex items-center gap-2">
        {!isEditing && (
          <EnterpriseButton label="جديد" icon={<UserPlus className="w-3 h-3" />} onClick={handleNewRecordInit} disabled={isLoading || !canEdit} />
        )}
        {isEditing && (
          <>
            <EnterpriseButton label="حفظ" icon={<Save className="w-3 h-3" />} onClick={handleSaveStudent} disabled={isLoading || isSaving} />
            <EnterpriseButton label="إلغاء" icon={<X className="w-3 h-3" />} onClick={handleCancel} variant="secondary" disabled={isLoading || isSaving} />
          </>
        )}
        {!isEditing && (
          <EnterpriseButton label="تعديل" icon={<CheckSquare className="w-3 h-3" />} onClick={handleEditStudent} variant="secondary" disabled={isLoading || !canEdit || !selectedStudentId} />
        )}
        <EnterpriseButton label="حذف" icon={<Trash2 className="w-3 h-3" />} onClick={handleDeleteStudent} variant="danger" disabled={isLoading || !canDelete || !selectedStudentId || isEditing} />
        <EnterpriseButton label="تحديث" icon={<RefreshCw className="w-3 h-3" />} onClick={handleRefresh} variant="secondary" disabled={isLoading || isEditing} />
        
        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Tools */}
        {canExport && !isEditing && (
          <div className="flex items-center gap-1">
            <button onClick={handlePrint} className="p-1.5 text-slate-500 hover:text-amber-600" title="طباعة"><Printer className="w-3.5 h-3.5" /></button>
            <button onClick={handleExportPdf} className="p-1.5 text-slate-500 hover:text-rose-600" title="تصدير PDF"><FileText className="w-3.5 h-3.5" /></button>
            <button onClick={handleExportExcel} className="p-1.5 text-slate-500 hover:text-emerald-600" title="تصدير Excel"><FileSpreadsheet className="w-3.5 h-3.5" /></button>
            <button onClick={handleImportExcel} className="p-1.5 text-slate-500 hover:text-violet-600" title="استيراد"><Upload className="w-3.5 h-3.5" /></button>
            <button onClick={handleDownloadTemplate} className="p-1.5 text-slate-500 hover:text-teal-600" title="قالب"><Download className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
