import { ArrowRightLeft, Ban, CheckCircle, Edit2, HelpCircle, Plus, RefreshCw, Search, Server, ShieldAlert, Sliders, Star, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface SuperAdminBranchesProps {
  schools: any[];
  branches: any[];
  setBranches: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

function displayText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const record = value as Record<string, unknown>;
  for (const key of ['city', 'name', 'label', 'address', 'value']) {
    const candidate = record[key];
    if (typeof candidate === 'string' || typeof candidate === 'number') return String(candidate);
  }
  return '';
}

function branchLocation(branch: any) {
  return {
    city: displayText(branch?.city) || displayText(branch?.address?.city),
    phone: displayText(branch?.phone) || displayText(branch?.address?.phone),
    address: displayText(branch?.address?.address) || displayText(branch?.address),
  };
}

export default function SuperAdminBranches({
  schools = [],
  branches = [],
  setBranches,
  logAction,
  triggerNotification
}: SuperAdminBranchesProps) {

  // Active School selection (defaults to first school)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true);

  // Local state for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Active branch being edited
  const [currentBranch, setCurrentBranch] = useState<any | null>(null);

  // Add Branch state
  const [newBranch, setNewBranch] = useState({
    name: '',
    city: 'الرياض',
    address: '',
    phone: ''
  });

  // Transfer Wizard State
  const [transferState, setTransferState] = useState({
    sourceBranchId: '',
    destBranchId: '',
    transferType: 'students', // students, teachers, ledger
    amount: 50,
    isProcessing: false,
    progress: 0,
    logs: [] as string[]
  });

  useEffect(() => {
    if (!selectedSchoolId && schools[0]?.id) setSelectedSchoolId(schools[0].id);
  }, [schools, selectedSchoolId]);

  useEffect(() => {
    let mounted = true;
    const loadCentralBranches = async () => {
      setIsDirectoryLoading(true);
      try {
        const response = await authenticatedRequest('/api/admin/central/branches');
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success || !Array.isArray(payload.branches)) throw new Error(payload?.message || 'تعذر تحميل دليل الفروع المركزي.');
        if (!mounted) return;
        setBranches(payload.branches.map((branch: any) => ({
          ...branch,
          schoolId: branch.school_id,
          branchCode: branch.branch_code,
          ...branchLocation(branch),
          status: branch.status === 'closed' ? 'suspended' : branch.status,
          isMain: Boolean(branch.is_main),
          studentsCount: Number(branch.students_count || 0),
          employeesCount: Number(branch.employees_count || 0),
        })));
      } catch (error) {
        if (mounted) triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل دليل الفروع المركزي.', 'danger');
      } finally {
        if (mounted) setIsDirectoryLoading(false);
      }
    };
    void loadCentralBranches();
    return () => { mounted = false; };
  }, [setBranches, triggerNotification]);

  const centralBranchMutation = async (branchId: string, body: Record<string, unknown>) => {
    const response = await authenticatedRequest(`/api/admin/central/branches/${encodeURIComponent(branchId)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.branch) throw new Error(payload?.message || 'تعذر حفظ الفرع مركزيًا.');
    return payload.branch;
  };

  const mapCanonicalBranch = (branch: any) => ({
    ...branch,
    schoolId: branch.school_id,
    branchCode: branch.branch_code,
    ...branchLocation(branch),
    status: branch.status === 'closed' ? 'suspended' : branch.status,
    isMain: Boolean(branch.is_main),
    studentsCount: Number(branch.students_count || 0),
    employeesCount: Number(branch.employees_count || 0),
  });

  // Filter branches of the active school
  const schoolBranches = branches.filter(b => b.schoolId === selectedSchoolId);
  const activeSchoolName = schools.find(s => s.id === selectedSchoolId)?.name || 'المدرسة المختارة';

  // -------------------------------------------------------------
  // ACTIONS HANDLERS
  // -------------------------------------------------------------

  // Handle Add Branch
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) {
      triggerNotification('يرجى تعبئة اسم الفرع', 'warning');
      return;
    }

    if (!selectedSchoolId) { triggerNotification('يرجى اختيار مدرسة أولاً.', 'warning'); return; }
    let createdBranch: any;
    try {
      const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(selectedSchoolId)}/branches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBranch.name, city: newBranch.city, address: newBranch.address, phone: newBranch.phone }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.branch) throw new Error(payload?.message || 'تعذر إنشاء الفرع مركزيًا.');
      createdBranch = mapCanonicalBranch(payload.branch);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء الفرع مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    setBranches(prev => [...prev, createdBranch]);
    logAction('CREATE_BRANCH', `تأسيس فرع جديد [${newBranch.name}] لمدرسة: ${activeSchoolName}`, 'الإدارة المركزية');
    triggerNotification('تم إنشاء الفرع في المصدر المركزي بنجاح ✅', 'success');
    
    setShowAddModal(false);
    setNewBranch({
      name: '',
       city: 'الرياض',
       address: '',
       phone: ''
    });
  };

  // Handle Edit Branch
  const handleSaveEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    let canonical: any;
    try {
      canonical = await centralBranchMutation(currentBranch.id, {
        operation: 'update', name: currentBranch.name, branchCode: currentBranch.branchCode || currentBranch.branch_code,
        city: currentBranch.city, phone: currentBranch.phone, address: currentBranch.address,
        status: currentBranch.status === 'suspended' ? 'closed' : currentBranch.status,
      });
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تحديث الفرع مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }
    setBranches(prev => prev.map(b => b.id === currentBranch.id ? mapCanonicalBranch(canonical) : b));
    logAction('EDIT_BRANCH', `تحديث بيانات الفرع [${currentBranch.name}] التابع لـ: ${activeSchoolName}`, 'الإدارة المركزية');
    triggerNotification('تم تحديث بيانات الفرع بنجاح', 'success');
    setShowEditModal(false);
  };

  // Handle Toggle Branch status (Freeze/Resume)
  const handleToggleFreezeBranch = async (branch: any) => {
    const isSuspended = branch.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';

    try {
      const canonical = await centralBranchMutation(branch.id, { operation: 'update', name: branch.name, branchCode: branch.branchCode || branch.branch_code, city: branch.city, phone: branch.phone, address: branch.address, status: newStatus === 'suspended' ? 'closed' : 'active' });
      setBranches(prev => prev.map(b => b.id === branch.id ? mapCanonicalBranch(canonical) : b));
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تغيير حالة الفرع مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }
    logAction(
      isSuspended ? 'ACTIVATE_BRANCH' : 'SUSPEND_BRANCH',
      `${isSuspended ? 'تفعيل' : 'تجميد مؤقت لخدمات'} فرع [${branch.name}] لمدرسة: ${activeSchoolName}`,
      'شؤون الفروع'
    );
    triggerNotification(
      isSuspended ? `تم تفعيل فرع ${branch.name} بنجاح` : `تم تعليق فرع ${branch.name} وإيقاف صلاحيات الولوج للموظفين فيه`,
      isSuspended ? 'success' : 'warning'
    );
  };

  // Handle Delete Branch
  const handleDeleteBranch = (branch: any) => {
    if (branch.isMain) {
      triggerNotification(`لا يمكن حذف الفرع "${branch.name}" لأنه الفرع الرئيسي المعتمد حالياً للتشغيل.`, 'danger');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف فرع "${branch.name}" نهائياً؟ لا يمكن التراجع عن هذه العملية.`)) {
      void centralBranchMutation(branch.id, { operation: 'archive' }).then(() => {
        setBranches(prev => prev.filter(b => b.id !== branch.id));
        logAction('DELETE_BRANCH', `أرشفة الفرع [${branch.name}] التابع لـ: ${activeSchoolName}`, 'الإدارة المركزية');
        triggerNotification('تمت أرشفة الفرع في المصدر المركزي ✅', 'success');
      }).catch((error) => {
        triggerNotification(error instanceof Error ? error.message : 'تعذر أرشفة الفرع مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      });
    }
  };

  // Set branch as main/primary
  const handleSetMainBranch = async (branch: any) => {
    if (branch.isMain) return;

    try {
      const canonical = await centralBranchMutation(branch.id, { operation: 'set_main' });
      setBranches(prev => prev.map(b => b.schoolId === selectedSchoolId ? { ...b, isMain: b.id === branch.id } : b));
      void canonical;
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر اعتماد الفرع الرئيسي مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    logAction('SET_MAIN_BRANCH', `تعيين فرع [${branch.name}] كفرع رئيسي معتمد لمدرسة: ${activeSchoolName}`, 'شؤون الفروع');
    triggerNotification(`تم اعتماد فرع ${branch.name} كفرع رئيسي عام لمدرسة ${activeSchoolName} بنجاح`, 'success');
  };

  // Transfer requires a server-side transaction over student/HR records.
  const handleExecuteTransfer = () => {
    if (!transferState.sourceBranchId || !transferState.destBranchId) {
      triggerNotification('يرجى اختيار فرع المصدر وفرع الهدف لترحيل البيانات', 'warning');
      return;
    }
    if (transferState.sourceBranchId === transferState.destBranchId) {
      triggerNotification('لا يمكن نقل البيانات لنفس الفرع', 'warning');
      return;
    }

    setTransferState(prev => ({ ...prev, isProcessing: false, progress: 0, logs: [] }));
    triggerNotification('ترحيل سجلات الطلاب والموظفين يحتاج معاملة مركزية مدققة لم تُفعّل بعد؛ لم يتم تعديل أي سجل.', 'warning');
  };

  const resetTransferState = () => {
    setTransferState({
      sourceBranchId: '',
      destBranchId: '',
      transferType: 'students',
      amount: 50,
      isProcessing: false,
      progress: 0,
      logs: []
    });
  };

  return (
    <div className="space-y-5 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Selector & Actions bar */}
      <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Actions */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فرع جديد</span>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="rounded-2xl bg-[#2a1a0e] border border-[#d4af37]/30 hover:border-[#f7d174] text-amber-200 hover:text-white px-3.5 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>ترحيل ونقل بيانات الفروع</span>
          </button>
        </div>

        {/* School Select filter */}
        <div className="flex items-center gap-3 w-full md:max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl px-4 py-2 shadow-sm transition-all duration-300">
          <span className="text-xs font-bold text-slate-400 shrink-0">المدرسة المستأجرة:</span>
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="w-full bg-transparent border-0 focus:border-amber-500 focus:ring-0 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none transition-all font-bold"
          >
            {schools.map(s => (
              <option key={s.id} value={s.id}>{displayText(s.name) || 'مدرسة غير مسماة'} ({displayText(s.city) || 'غير محدد'})</option>
            ))}
          </select>
        </div>

      </div>

      {/* Branches Table List */}
      <div className="bg-[#fffdf8] border-2 border-[#d4af37]/30 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-4 bg-[#2a1d13] border-b border-[#d4af37]/20 flex justify-between items-center">
          <span className="text-xs font-black text-white">
            قائمة الفروع والمقرات التابعة لـ: <span className="text-amber-400 font-extrabold">{activeSchoolName}</span>
          </span>
          <span className="bg-[#1c120c] px-2.5 py-1 rounded-full text-[10px] text-amber-100 font-mono">
            عدد الفروع: {schoolBranches.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#fbf8f0] text-slate-500 font-extrabold border-b border-amber-900/10">
              <tr>
                <th className="p-4 text-center w-8">#</th>
                <th className="p-4 w-12 text-center">رئيسي</th>
                <th className="p-4">اسم الفرع الجغرافي</th>
                <th className="p-4">المدينة والعنوان</th>
                <th className="p-4 font-mono text-center">الطلاب المخدومين</th>
                <th className="p-4 font-mono text-center">الموظفين والكادر</th>
                <th className="p-4">الحالة العامة للفرع</th>
                <th className="p-4 text-center w-40">العمليات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-slate-700">
              {schoolBranches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <Server className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
                    <p className="font-bold text-slate-400">لا توجد فروع مأسسة لهذه المدرسة حالياً</p>
                    <p className="text-[10px] text-slate-600 mt-1">اضغط على زر "إضافة فرع جديد" لإطلاق أول موقع تشغيل.</p>
                  </td>
                </tr>
              ) : (
                schoolBranches.map((branch, idx) => (
                  <tr key={branch.id} className="hover:bg-[#fbf8f0] transition-colors">
                    
                    {/* Index */}
                    <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                    
                    {/* isMain column */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSetMainBranch(branch)}
                        title={branch.isMain ? 'فرع معتمد رئيسي' : 'اضغط للاعتماد كفرع رئيسي'}
                        className={`p-1.5 rounded-full transition-colors ${
                          branch.isMain 
                            ? 'text-amber-400 bg-amber-950/40 border border-amber-900/60' 
                            : 'text-slate-600 hover:text-slate-400 bg-slate-950 border border-slate-850'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    {/* Name */}
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{branch.name}</span>
                        {branch.isMain && (
                          <span className="text-[8px] bg-amber-950 text-amber-300 border border-amber-900 px-1.5 py-0.5 rounded font-black">رئيسي HQ</span>
                        )}
                      </div>
                    </td>

                    {/* Address & City */}
                    <td className="p-4">
                      <div>
                        <span className="font-bold">{displayText(branch.city) || 'غير محدد'}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{displayText(branch.address)}</p>
                      </div>
                    </td>

                    {/* Students Count */}
                    <td className="p-4 text-center font-mono font-extrabold text-slate-900 text-sm">
                      {(branch.studentsCount || 0).toLocaleString('ar-EG')}
                    </td>

                    {/* Employees Count */}
                    <td className="p-4 text-center font-mono font-bold text-slate-400">
                      {branch.employeesCount || 0}
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black inline-block ${
                        branch.status === 'active' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' 
                          : 'bg-rose-950 text-rose-400 border border-rose-900/40'
                      }`}>
                        {branch.status === 'active' ? 'مفعل وجاهز' : 'مجمد إدارياً'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentBranch(branch);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="تعديل بيانات الفرع"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleFreezeBranch(branch)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            branch.status === 'suspended'
                              ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400 hover:bg-emerald-950/60'
                              : 'bg-amber-950/30 border-amber-900 text-amber-400 hover:bg-amber-950/60'
                          }`}
                          title={branch.status === 'suspended' ? 'إعادة التفعيل' : 'تجميد الفرع مؤقتاً'}
                        >
                          {branch.status === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteBranch(branch)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-950 text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف الفرع نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS DECLARATIONS
      ------------------------------------------------------------- */}

      {/* Modal A: Add Branch */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">إنشاء فرع جديد تحت المدرسة المستأجرة</h3>
            </div>

            <form onSubmit={handleAddBranch} className="p-6 space-y-4">
              <div className="space-y-3">
                
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">اسم الفرع الجغرافي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فرع السليمانية - بنين"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">المدينة المقر:</label>
                  <select
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({...newBranch, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="الدمام">الدمام</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">هاتف الاتصال بالفرع:</label>
                  <input
                    type="text"
                    placeholder="+966 5..."
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">العنوان الكامل للفرع:</label>
                  <input
                    type="text"
                    placeholder="شارع الأمير سلطان، حي الروضة"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2 rounded-xl">تأكيد وحفظ الفرع ⚡</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Edit Branch */}
      {showEditModal && currentBranch && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">تعديل بيانات الفرع والمقرات</h3>
            </div>

            <form onSubmit={handleSaveEditBranch} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">اسم الفرع:</label>
                  <input
                    type="text"
                    required
                    value={currentBranch.name}
                    onChange={(e) => setCurrentBranch({...currentBranch, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">الهاتف:</label>
                  <input
                    type="text"
                    value={currentBranch.phone}
                    onChange={(e) => setCurrentBranch({...currentBranch, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">العنوان الجغرافي للفرع:</label>
                  <input
                    type="text"
                    value={currentBranch.address}
                    onChange={(e) => setCurrentBranch({...currentBranch, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Data Transfer Wizard between school branches */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => { resetTransferState(); setShowTransferModal(false); }} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                ترحيل ونقل السجلات بين فروع المدرسة المستأجرة
              </h3>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="p-3 bg-amber-950/20 border border-amber-900/40 text-amber-400 text-xs leading-relaxed">
                 هذا المسار مخصص لطلب ترحيل السجلات بين فرعين داخل المدرسة. التنفيذ محجوب حتى تتوفر معاملة مركزية مدققة؛ لن تُنقل أي بيانات من هذه النافذة حالياً.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Source branch */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">من فرع (المصدر):</label>
                  <select
                    value={transferState.sourceBranchId}
                    disabled={transferState.isProcessing}
                    onChange={(e) => setTransferState({...transferState, sourceBranchId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- اختر فرع المصدر --</option>
                    {schoolBranches.map(b => (
                      <option key={b.id} value={b.id}>{displayText(b.name) || 'فرع غير مسمى'} ({displayText(b.city) || 'غير محدد'})</option>
                    ))}
                  </select>
                </div>

                {/* Destination branch */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">إلى فرع (الهدف):</label>
                  <select
                    value={transferState.destBranchId}
                    disabled={transferState.isProcessing}
                    onChange={(e) => setTransferState({...transferState, destBranchId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- اختر فرع الهدف --</option>
                    {schoolBranches.map(b => (
                      <option key={b.id} value={b.id}>{displayText(b.name) || 'فرع غير مسمى'} ({displayText(b.city) || 'غير محدد'})</option>
                    ))}
                  </select>
                </div>

                {/* Transfer Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">نوع البيانات المراد نقلها:</label>
                  <select
                    value={transferState.transferType}
                    disabled={transferState.isProcessing}
                    onChange={(e) => setTransferState({...transferState, transferType: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="students">حزم سجلات الطلاب (Students Records)</option>
                    <option value="teachers">سجلات الكوادر والموظفين (Staff Records)</option>
                  </select>
                </div>

                {/* Count/Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">العدد المستهدف للنقل:</label>
                  <input
                    type="number"
                    min="1"
                    disabled={transferState.isProcessing}
                    value={transferState.amount}
                    onChange={(e) => setTransferState({...transferState, amount: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

              </div>

              {/* Progress and Logs block during execution */}
              {(transferState.isProcessing || transferState.progress > 0) && (
                <div className="space-y-2 pt-2 border-t border-slate-850">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">جاري مراجعة وتحويل السجلات الموزعة...</span>
                    <span className="text-amber-400 font-mono font-black">{transferState.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                      style={{ width: `${transferState.progress}%` }}
                    />
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-24 overflow-y-auto text-left font-mono text-[9px] text-slate-300" dir="ltr">
                    {transferState.logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  disabled={transferState.isProcessing}
                  onClick={() => { resetTransferState(); setShowTransferModal(false); }} 
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="button"
                  disabled={transferState.isProcessing || transferState.progress === 100}
                  onClick={handleExecuteTransfer}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {transferState.isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الترحيل...</span>
                    </>
                  ) : (
                    <span>تشغيل ترحيل السجلات ⚡</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
