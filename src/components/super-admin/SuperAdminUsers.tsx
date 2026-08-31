import { Ban, CheckCircle, Edit2, HelpCircle, Key, Laptop, Lock as LockIcon, Mail, Plus, RefreshCw, Search, ShieldAlert, ShieldCheck, Trash2, UserCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
interface SuperAdminUsersProps {
  schools: any[];
  branches: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminUsers({
  schools = [],
  branches = [],
  logAction,
  triggerNotification
}: SuperAdminUsersProps) {

  const [employees, setEmployees] = useState<any[]>([]);
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(true);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchoolId, setFilterSchoolId] = useState('all');

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  // Focus users
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [resetDetails, setResetDetails] = useState({ name: '', password: '' });

  // Add User State
  const [newUser, setNewUser] = useState({
    name: '',
    jobTitle: '',
    department: 'شئون الطلاب',
    email: '',
    schoolId: schools[0]?.id || '',
    branchId: '',
    password: '',
    initialRole: 'SchoolAdmin'
  });

  // Filter branches based on selected school in "Add User"
  const newUserBranches = branches.filter(b => b.schoolId === newUser.schoolId);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      setIsDirectoryLoading(true);
      try {
        const response = await authenticatedRequest('/api/admin/central/users');
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success || !Array.isArray(payload.users)) throw new Error(payload?.message || 'تعذر تحميل دليل الهوية المركزي.');
        if (mounted) setEmployees(payload.users.map((user: any) => ({
          ...user,
          name: user.display_name,
          email: user.email || '',
          schoolId: user.school_id,
          branchId: user.branch_id,
          jobTitle: user.roles?.[0]?.name || 'موظف نظام',
          department: user.school_name || 'المدرسة',
          forcePasswordChange: false,
          loginCount: 0,
          lastLogin: 'غير متاح من الدليل الحالي',
        })));
      } catch (error) {
        if (mounted) triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل دليل الهوية المركزي.', 'danger');
      } finally {
        if (mounted) setIsDirectoryLoading(false);
      }
    };
    void loadUsers();
    return () => { mounted = false; };
  }, [triggerNotification]);

  const mapCanonicalUser = (user: any) => ({
    ...user,
    name: user.display_name,
    email: user.email || '',
    schoolId: user.school_id,
    branchId: user.branch_id,
    jobTitle: user.roles?.[0]?.name || user.jobTitle || 'موظف نظام',
    department: user.school_name || 'المدرسة',
  });

  const mutateCentralUser = async (userId: string, body: Record<string, unknown>) => {
    const response = await authenticatedRequest(`/api/admin/central/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.user) throw new Error(payload?.message || 'تعذر حفظ مستخدم الهوية مركزيًا.');
    return payload;
  };

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      triggerNotification('يرجى تعبئة الحقول الأساسية لإنشاء الموظف', 'warning');
      return;
    }

    if (!newUser.schoolId) { triggerNotification('يرجى اختيار مدرسة موثقة أولاً.', 'warning'); return; }
    try {
      const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(newUser.schoolId)}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUser.name, email: newUser.email, password: newUser.password, branchId: newUser.branchId || undefined, initialRole: newUser.initialRole }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.user) throw new Error(payload?.message || 'تعذر إنشاء هوية الموظف مركزيًا.');
      const created = mapCanonicalUser(payload.user);
      setEmployees(prev => [created, ...prev]);
      logAction('CREATE_USER', `إنشاء هوية مركزية للموظف [${newUser.name}]`, 'المستخدمين والصلاحيات');
      triggerNotification('تم إنشاء الهوية وربطها بالمدرسة والدور مركزيًا ✅', 'success');
      if (payload.temporaryPassword) {
        setResetDetails({ name: newUser.name, password: payload.temporaryPassword });
        setShowPasswordResetModal(true);
      }
      setShowAddModal(false);
      setNewUser({ name: '', jobTitle: '', department: 'شئون الطلاب', email: '', schoolId: schools[0]?.id || '', branchId: '', password: '', initialRole: 'SchoolAdmin' });
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء هوية الموظف؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const payload = await mutateCentralUser(currentUser.id, { operation: 'update', displayName: currentUser.name });
      setEmployees(prev => prev.map(user => user.id === currentUser.id ? { ...user, ...mapCanonicalUser(payload.user) } : user));
      triggerNotification('تم حفظ بيانات الموظف في الهوية المركزية ✅', 'success');
      setShowEditModal(false);
    } catch (error) { triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ بيانات الموظف مركزيًا.', 'danger'); }
  };

  // Toggle user state (Suspend / Resume)
  const handleToggleFreezeUser = async (user: any) => {
    const status = user.status === 'suspended' ? 'active' : 'suspended';
    try { const payload = await mutateCentralUser(user.id, { operation: 'status', status }); setEmployees(prev => prev.map(item => item.id === user.id ? { ...item, ...mapCanonicalUser(payload.user) } : item)); triggerNotification(status === 'active' ? 'تم تفعيل الهوية مركزيًا ✅' : 'تم تعليق الهوية مركزيًا', status === 'active' ? 'success' : 'warning'); }
    catch (error) { triggerNotification(error instanceof Error ? error.message : 'تعذر تغيير حالة الهوية مركزيًا.', 'danger'); }
  };

  // Lock / Unlock user account
  const handleToggleLockUser = async (user: any) => {
    const status = user.status === 'locked' ? 'active' : 'disabled';
    try { const payload = await mutateCentralUser(user.id, { operation: 'status', status }); setEmployees(prev => prev.map(item => item.id === user.id ? { ...item, ...mapCanonicalUser(payload.user), status: status === 'disabled' ? 'locked' : status } : item)); triggerNotification(status === 'active' ? 'تم إلغاء قفل الهوية مركزيًا ✅' : 'تم قفل الهوية مركزيًا', status === 'active' ? 'success' : 'danger'); }
    catch (error) { triggerNotification(error instanceof Error ? error.message : 'تعذر قفل الهوية مركزيًا.', 'danger'); }
  };

  // Terminate/Delete User accounts
  const handleTerminateUser = async (user: any) => {
    if (confirm(`⚠️ تحذير: هل أنت متأكد من أرشفة هوية الموظف [${user.name}]؟`)) {
      try { await mutateCentralUser(user.id, { operation: 'archive' }); setEmployees(prev => prev.filter(item => item.id !== user.id)); triggerNotification('تمت أرشفة الهوية مركزيًا ✅', 'warning'); }
      catch (error) { triggerNotification(error instanceof Error ? error.message : 'تعذر أرشفة الهوية مركزيًا.', 'danger'); }
    }
  };

  // Reset password wizard
  const handleResetPassword = async (user: any) => {
    try { const payload = await mutateCentralUser(user.id, { operation: 'reset_password' }); setResetDetails({ name: user.name, password: payload.temporaryPassword }); setShowPasswordResetModal(true); triggerNotification('تم إصدار كلمة مرور مؤقتة من Supabase Auth المركزي ✅', 'success'); }
    catch (error) { triggerNotification(error instanceof Error ? error.message : 'تعذر إعادة كلمة المرور مركزيًا.', 'danger'); }
  };

  // Toggle Force Password Change next login
  const handleToggleForcePassword = async (user: any) => {
    try { const payload = await mutateCentralUser(user.id, { operation: 'force_password', forcePasswordChange: !user.forcePasswordChange }); setEmployees(prev => prev.map(item => item.id === user.id ? { ...item, ...mapCanonicalUser(payload.user), forcePasswordChange: payload.user.forcePasswordChange } : item)); triggerNotification('تم تحديث سياسة كلمة المرور مركزيًا ✅', 'info'); }
    catch (error) { triggerNotification(error instanceof Error ? error.message : 'تعذر تحديث سياسة كلمة المرور.', 'danger'); }
  };

  // Forcefully terminate/end all user's active sessions (Token Eviction)
  const handleEvictSessions = (user: any) => {
    triggerNotification(`إنهاء الجلسات النشطة لـ ${user.name} يحتاج موصل جلسات مركزي؛ لم يتم تسجيل نجاح وهمي.`, 'warning');
  };

  // -------------------------------------------------------------
  // FILTERS LOGIC
  // -------------------------------------------------------------
  const filteredUsers = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSchool = filterSchoolId === 'all' || emp.schoolId === filterSchoolId;

    return matchesSearch && matchesSchool;
  });

  return (
    <div className="space-y-5 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Search and school selector bar */}
      <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Create user button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء حساب مستخدم جديد</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl px-4 py-2 shadow-sm transition-all duration-300">
          {/* School Select filter */}
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <span className="text-xs font-bold text-slate-400 shrink-0">تصفية حسب المنشأة:</span>
            <select
              value={filterSchoolId}
              onChange={(e) => setFilterSchoolId(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-amber-500 px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none transition-all font-bold"
            >
              <option value="all">كل المدارس والمنشآت</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Federal Search */}
          <div className="relative w-full sm:w-1/2">
            <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
            <input
              type="text"
              placeholder="بحث باسم الموظف، الوظيفة، أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-amber-500 pr-9 pl-4 py-1.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* Users Interactive Directory Table */}
      <div className="rounded-3xl bg-[#fffdf8] border-2 border-[#d4af37]/30 overflow-hidden shadow-lg">
        <div className="p-4 bg-[#2a1d13] border-b border-[#d4af37]/20 flex justify-between items-center text-xs">
          <span className="font-black text-white">دليل حسابات المستخدمين والكوادر الفيدرالي الموحد</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded text-slate-400 font-mono font-bold">
            عدد الحسابات المعروضة: {filteredUsers.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#fbf8f0] text-slate-500 font-extrabold uppercase border-b border-amber-900/10">
              <tr>
                <th className="p-4 text-center w-8">#</th>
                <th className="p-4">هوية الموظف والمنشأة</th>
                <th className="p-4">المنصب والوظيفة</th>
                <th className="p-4">البريد وتوثيق الدخول</th>
                <th className="p-4 font-mono text-center">مرات الدخول</th>
                <th className="p-4">عنوان IP والجهاز</th>
                <th className="p-4">حالة الحساب</th>
                <th className="p-4 text-center w-64">إجراءات الحماية والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <Laptop className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
                    <p className="font-bold text-slate-400">لا يوجد حسابات مستخدمين مطابقة للبحث</p>
                    <p className="text-[10px] text-slate-600 mt-1">تأكد من كتابة الاسم صحيحاً أو تغيير تصفية المدرسة.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const schoolLabel = schools.find(s => s.id === user.schoolId)?.schoolShortName || '';
                  const branchLabel = branches.find(b => b.id === user.branchId)?.name || 'الفرع العام';
                  
                  return (
                    <tr key={user.id} className="hover:bg-[#fbf8f0] transition-colors">
                      <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                      
                      {/* Name and School */}
                      <td className="p-4">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm hover:text-amber-700 transition-colors block">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {schoolLabel} ← <span className="text-slate-400">{branchLabel}</span>
                          </span>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="p-4 font-bold">
                        <div>
                          <span className="text-slate-800 block">{user.jobTitle}</span>
                          <span className="text-[10px] text-amber-400 mt-0.5 block">{user.department}</span>
                        </div>
                      </td>

                      {/* Email and Auth */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="text-slate-400 font-mono block text-left" dir="ltr">{user.email}</span>
                          {user.forcePasswordChange && (
                            <span className="text-[8px] bg-amber-950 text-amber-400 border border-amber-900 px-1 rounded block w-fit">يجب تغيير الرمز عند الدخول 🔑</span>
                          )}
                        </div>
                      </td>

                      {/* Login Count */}
                      <td className="p-4 text-center font-mono font-extrabold text-slate-900">
                        {user.loginCount || 0}
                      </td>

                      {/* IP and Device */}
                      <td className="p-4">
                        <div className="font-mono text-[10px] space-y-0.5">
                          <div className="text-slate-400 text-left" dir="ltr">{user.ip || '0.0.0.0'}</div>
                          <div className="text-slate-600 text-[9px] text-left" dir="ltr">{user.device || 'أجهزة متعددة'}</div>
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black inline-block ${
                          user.status === 'active' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' 
                            : user.status === 'suspended'
                            ? 'bg-amber-950 text-amber-400 border border-amber-900/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-900/40'
                        }`}>
                          {user.status === 'active' ? 'نشط' : 
                           user.status === 'suspended' ? 'مجمد' : 'مقفل أمنياً'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Edit user details */}
                          <button
                            onClick={() => {
                              setCurrentUser(user);
                              setShowEditModal(true);
                            }}
                            title="تعديل بيانات الحساب"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(user)}
                            title="إعادة توليد كلمة المرور"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Force Password Change */}
                          <button
                            onClick={() => handleToggleForcePassword(user)}
                            title="فرض تغيير كلمة المرور عند الولوج"
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              user.forcePasswordChange 
                                ? 'bg-amber-950 text-amber-400 border-amber-900' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <LockIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Lock / Unlock account */}
                          <button
                            onClick={() => handleToggleLockUser(user)}
                            title={user.status === 'locked' ? 'إلغاء قفل الحساب' : 'قفل الحساب فوراً'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              user.status === 'locked'
                                ? 'bg-rose-950 text-rose-400 border-rose-900'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>

                          {/* End active sessions (Token Eviction) */}
                          <button
                            onClick={() => handleEvictSessions(user)}
                            title="طرد وإنهاء جميع الجلسات النشطة"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-750 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Freeze account */}
                          <button
                            onClick={() => handleToggleFreezeUser(user)}
                            title={user.status === 'suspended' ? 'إلغاء التجميد' : 'تجميد الحساب'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              user.status === 'suspended'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {user.status === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>

                          {/* Cancel / delete account */}
                          <button
                            onClick={() => handleTerminateUser(user)}
                            title="حذف حساب المستخدم نهائياً"
                            className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS
      ------------------------------------------------------------- */}

      {/* Modal A: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">إنشاء حساب موظف جديد وتخصيص صلاحياته</h3>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* School Target */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">المنشأة التعليمية المستهدفة:</label>
                  <select
                    value={newUser.schoolId}
                    onChange={(e) => setNewUser({...newUser, schoolId: e.target.value, branchId: ''})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Target */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">الفرع المخصص:</label>
                  <select
                    value={newUser.branchId}
                    onChange={(e) => setNewUser({...newUser, branchId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- الفرع الرئيسي الافتراضي --</option>
                    {newUserBranches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">الاسم الرباعي الكامل:</label>
                  <input
                    type="text"
                    required
                    placeholder="أحمد بن فيصل الحربي"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">البريد الإلكتروني للولوج:</label>
                  <input
                    type="email"
                    required
                    placeholder="example@cloudschool.edu.sa"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Job Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">المسمى الوظيفي:</label>
                  <input
                    type="text"
                    placeholder="مثال: أخصائي تسجيل وقبول"
                    value={newUser.jobTitle}
                    onChange={(e) => setNewUser({...newUser, jobTitle: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">الإدارة التابع لها:</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="شئون الطلاب">شئون الطلاب والقبول</option>
                    <option value="الإدارة المالية">الإدارة المالية</option>
                    <option value="الموارد البشرية">الموارد البشرية</option>
                    <option value="تقنية المعلومات">تقنية المعلومات والدعم</option>
                  </select>
                </div>

                {/* Password input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">رمز المرور المبدئي (تتركه فارغاً لتوليد آمن):</label>
                  <input
                    type="text"
                    placeholder="توليد عشوائي آمن..."
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء الأمر</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-2 rounded-xl">إنشاء الحساب وتوليد الوثيقة ⚡</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Edit User Details */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">تعديل بيانات حساب الموظف</h3>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    value={currentUser.name}
                    onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">المسمى الوظيفي:</label>
                  <input
                    type="text"
                    required
                    value={currentUser.jobTitle}
                    onChange={(e) => setCurrentUser({...currentUser, jobTitle: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">الإدارة والقسم:</label>
                  <select
                    value={currentUser.department}
                    onChange={(e) => setCurrentUser({...currentUser, department: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="شئون الطلاب">شئون الطلاب والقبول</option>
                    <option value="الإدارة المالية">الإدارة المالية</option>
                    <option value="الموارد البشرية">الموارد البشرية</option>
                    <option value="تقنية المعلومات">تقنية المعلومات والدعم</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">البريد الإلكتروني للاتصال والدخول:</label>
                  <input
                    type="email"
                    required
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Password Reset Success Details Card */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-5 text-white text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/20 mx-auto flex items-center justify-center text-2xl">🔑</div>
              <h3 className="text-sm font-black">تم توليد وحفظ كلمة المرور بأمان</h3>
              <p className="text-[10px] text-white/80">تم تفعيل مفتاح الدخول وتأمين الاتصال بنجاح</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                يرجى مشاركة الرمز المؤقت المولد مع الموظف <strong className="text-white">[{resetDetails.name}]</strong> للولوج الآمن لمنشأته. سيلتزم بتعيين رمز جديد تماماً عند أول محاولة دخول.
              </p>

              <div className="bg-slate-950 text-white p-4 border border-slate-850 relative overflow-hidden text-center">
                <span className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-widest">مفتاح الدخول المؤقت للموظف</span>
                <div className="text-xl font-mono font-black tracking-wider text-amber-300 select-all" dir="ltr">
                  {resetDetails.password}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setShowPasswordResetModal(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 px-5 py-2 font-bold cursor-pointer transition-colors w-full"
                >
                  تم نسخ وتوثيق الرمز السري 👍
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
