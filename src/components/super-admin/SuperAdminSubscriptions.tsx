import { AlertTriangle, Award, Ban, Calendar, CheckCircle, ChevronLeft, Clock, CreditCard, MessageSquare, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
interface SuperAdminSubscriptionsProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminSubscriptions({
  schools = [],
  setSchools,
  logAction,
  triggerNotification
}: SuperAdminSubscriptionsProps) {
  const [filterType, setFilterType] = useState<'all' | '30days' | '15days' | '7days' | 'today' | 'expired' | 'suspended' | 'trial' | 'overlimit'>('all');
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  
  // Modals
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  
  // Modal Form States
  const [extendDays, setExtendDays] = useState('30');
  const [newPlan, setNewPlan] = useState('Enterprise');
  const [renewMonths, setRenewMonths] = useState('12');
  const [noticeText, setNoticeText] = useState('');
  const [noticeMethod, setNoticeMethod] = useState<'system' | 'email'>('system');

  const updateCentralSchool = async (school: any, operation: 'status' | 'update', details: Record<string, unknown> = {}) => {
    const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(school.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, ...(operation === 'update' ? { name: school.name, schoolCode: school.schoolCode, profile: details } : details) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.school) throw new Error(payload?.message || 'تعذر حفظ التغيير في الدليل المركزي.');
    return payload.school;
  };

  const applyCanonicalSchool = (canonical: any) => {
    const profile = canonical.central_metadata && typeof canonical.central_metadata === 'object' ? canonical.central_metadata : {};
    const next = { ...profile, ...canonical, name: canonical.display_name, schoolCode: canonical.school_code };
    setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, ...next } : item));
    setSelectedSchool(prev => prev?.id === canonical.id ? { ...prev, ...next } : prev);
  };

  // Compute expiration days helper
  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 999;
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter school based on selection
  const filteredSchools = schools.filter(school => {
    const days = getDaysRemaining(school.subscriptionEnd);
    const isTrial = school.plan === 'Basic' || school.isTrial;
    const isSuspended = school.status === 'frozen' || school.status === 'suspended';
    
    // Resource limits check (e.g. storage used > storage limit)
    const storageUsedGb = parseFloat(school.storageUsed || '0');
    const storageLimitGb = parseFloat(school.storageLimit || '0');
    const isOverlimit = storageUsedGb > storageLimitGb || (school.usersCount > parseInt(school.userLimit || '1000'));

    switch (filterType) {
      case '30days':
        return days > 15 && days <= 30 && !isSuspended;
      case '15days':
        return days > 7 && days <= 15 && !isSuspended;
      case '7days':
        return days > 0 && days <= 7 && !isSuspended;
      case 'today':
        return days === 0 && !isSuspended;
      case 'expired':
        return days < 0 && !isSuspended;
      case 'suspended':
        return isSuspended;
      case 'trial':
        return isTrial;
      case 'overlimit':
        return isOverlimit;
      default:
        return true;
    }
  });

  // Action: Suspend / Freeze School
  const handleToggleSuspend = async (school: any) => {
    const shouldFreeze = school.status !== 'frozen' && school.status !== 'suspended';
    const updatedStatus = shouldFreeze ? 'suspended' : 'active';
    try {
      const canonical = await updateCentralSchool(school, 'status', { status: updatedStatus });
      applyCanonicalSchool(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تغيير حالة المدرسة مركزياً؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }
    
    logAction(
      shouldFreeze ? 'SUSPEND_SCHOOL' : 'RESUME_SCHOOL',
      `${shouldFreeze ? 'إيقاف وتعليق' : 'إعادة تنشيط'} خدمات المستأجر السحابي: ${school.name}`,
      'إدارة الاشتراكات والتراخيص'
    );
    
    triggerNotification(
      shouldFreeze 
        ? `تم إيقاف مدرسة ${school.name} بنجاح وحظر الوصول لقاعدتها السحابية 🔒` 
        : `تم إعادة تفعيل مدرسة ${school.name} وإطلاق صلاحيات العمل السحابية 🟢`,
      shouldFreeze ? 'danger' : 'success'
    );
  };

  // Action: Renew Subscription
  const handleRenew = async () => {
    if (!selectedSchool) return;
    const months = parseInt(renewMonths);
    const currentEnd = new Date(selectedSchool.subscriptionEnd || new Date());
    currentEnd.setMonth(currentEnd.getMonth() + months);
    
    try {
      const canonical = await updateCentralSchool(selectedSchool, 'update', { subscriptionEnd: currentEnd.toISOString().split('T')[0] });
      applyCanonicalSchool(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تجديد الاشتراك مركزياً؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    logAction(
      'RENEW_SUBSCRIPTION',
      `تجديد اشتراك مدرسة ${selectedSchool.name} لمدة ${months} شهراً إضافية.`,
      'إدارة الاشتراكات والتراخيص'
    );

    triggerNotification(`تم تجديد الاشتراك لمدرسة ${selectedSchool.name} بنجاح إلى تاريخ ${currentEnd.toISOString().split('T')[0]} ✅`, 'success');
    setShowRenewModal(false);
  };

  // Action: Extend Subscription
  const handleExtend = async () => {
    if (!selectedSchool) return;
    const days = parseInt(extendDays);
    const currentEnd = new Date(selectedSchool.subscriptionEnd || new Date());
    currentEnd.setDate(currentEnd.getDate() + days);
    
    try {
      const canonical = await updateCentralSchool(selectedSchool, 'update', { subscriptionEnd: currentEnd.toISOString().split('T')[0] });
      applyCanonicalSchool(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تمديد الاشتراك مركزياً؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    logAction(
      'EXTEND_SUBSCRIPTION',
      `تمديد استثنائي لاشتراك مدرسة ${selectedSchool.name} بمقدار ${days} يوماً.`,
      'إدارة الاشتراكات والتراخيص'
    );

    triggerNotification(`تم تمديد اشتراك ${selectedSchool.name} بمقدار ${days} يوماً بنجاح ⏳`, 'success');
    setShowExtendModal(false);
  };

  // Action: Change Plan
  const handlePlanChange = async () => {
    if (!selectedSchool) return;
    
    // Adjust limits based on plan
    const limits: Record<string, { storage: string, users: string }> = {
      'Basic': { storage: '100 GB', users: '1000' },
      'Business': { storage: '500 GB', users: '3000' },
      'Enterprise': { storage: '1024 GB', users: '5000' }
    };
    
    const limit = limits[newPlan] || limits['Enterprise'];

    try {
      const canonical = await updateCentralSchool(selectedSchool, 'update', {
        plan: newPlan,
        storageLimit: limit.storage,
        userLimit: limit.users,
      });
      applyCanonicalSchool(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تغيير الباقة مركزياً؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    logAction(
      'CHANGE_PLAN',
      `تغيير باقة الاشتراك لمدرسة ${selectedSchool.name} إلى باقة ${newPlan}.`,
      'إدارة الاشتراكات والتراخيص'
    );

    triggerNotification(`تمت ترقية الباقة لـ ${selectedSchool.name} إلى باقة ${newPlan} بنجاح 🚀`, 'success');
    setShowPlanModal(false);
  };

  // Action: Send Notification
  const handleSendNotice = () => {
    if (!selectedSchool || !noticeText) return;

    triggerNotification(`إرسال تنبيهات الترخيص عبر ${noticeMethod === 'email' ? 'البريد الإلكتروني' : 'إشعارات النظام'} يحتاج موصل إشعارات مركزي؛ لم يتم تسجيل إرسال وهمي.`, 'warning');
  };

  return (
    <div id="super-admin-subscriptions" className="space-y-6 text-right">
      
      {/* Dynamic Expiration Overview Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
        {[
          { id: 'all', label: 'الكل', color: 'bg-slate-900 border-slate-800 text-white' },
          { id: '30days', label: 'خلال 30 يوماً', color: 'border-yellow-600/30 text-yellow-400 bg-yellow-950/10' },
          { id: '15days', label: 'خلال 15 يوماً', color: 'border-amber-600/30 text-amber-400 bg-amber-950/10' },
          { id: '7days', label: 'خلال 7 أيام', color: 'border-orange-600/30 text-orange-400 bg-orange-950/10' },
          { id: 'today', label: 'اليوم', color: 'border-red-600/40 text-red-400 bg-red-950/20' },
          { id: 'expired', label: 'منتهية الصلاحية', color: 'border-rose-600 text-rose-500 bg-rose-950/30' },
          { id: 'suspended', label: 'الموقوفة 🔒', color: 'border-slate-700 text-slate-400 bg-slate-850/40' },
          { id: 'trial', label: 'التجريبية', color: 'border-teal-600/30 text-teal-400 bg-teal-950/10' },
          { id: 'overlimit', label: 'تجاوز الحدود', color: 'border-purple-600/30 text-purple-400 bg-purple-950/10' }
        ].map((btn) => {
          const count = schools.filter(school => {
            const days = getDaysRemaining(school.subscriptionEnd);
            const isTrial = school.plan === 'Basic' || school.isTrial;
            const isSuspended = school.status === 'frozen' || school.status === 'suspended';
            const storageUsedGb = parseFloat(school.storageUsed || '0');
            const storageLimitGb = parseFloat(school.storageLimit || '0');
            const isOverlimit = storageUsedGb > storageLimitGb || (school.usersCount > parseInt(school.userLimit || '1000'));
            
            if (btn.id === 'all') return true;
            if (btn.id === '30days') return days > 15 && days <= 30 && !isSuspended;
            if (btn.id === '15days') return days > 7 && days <= 15 && !isSuspended;
            if (btn.id === '7days') return days > 0 && days <= 7 && !isSuspended;
            if (btn.id === 'today') return days === 0 && !isSuspended;
            if (btn.id === 'expired') return days < 0 && !isSuspended;
            if (btn.id === 'suspended') return isSuspended;
            if (btn.id === 'trial') return isTrial;
            if (btn.id === 'overlimit') return isOverlimit;
            return false;
          }).length;

          return (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id as any)}
              className={`p-3 border text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                filterType === btn.id 
                  ? 'ring-2 ring-amber-500/50 bg-[#dfb55a]/10 border-[#dfb55a] text-[#dfb55a]' 
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
            >
              <span className="truncate">{btn.label}</span>
              <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-950/60 text-amber-500 font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Subscription Alert Warning Indicator */}
      <div className="bg-slate-900 border border-amber-500/20 p-4 flex items-start gap-3 select-none">
        <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-100">بوابة رصد التراخيص التلقائية</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            تراقب الخوادم بنشاط تاريخ استحقاق العقود ومستويات استهلاك الحصص السحابية لجميع المدارس. المدارس التي شارفت اشتراكاتها على الانتهاء ستتلقى تنبيهات تلقائية داخل واجهاتها عند الدخول، مع إمكانية اتخاذ قرار يدوي سريع بالإيقاف المؤقت أو التمديد الاستثنائي لضمان استقرار العمليات التعليمية.
          </p>
        </div>
      </div>

      {/* Tenants/Schools Subscription List */}
      <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            تراخيص المستأجرين السحابيين ({filteredSchools.length})
          </h3>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-3 py-1 rounded-lg border border-slate-850 font-bold">
            البوابة الذكية الموحدة لخطط الدفع وحظر الخوادم
          </span>
        </div>

        {filteredSchools.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs font-bold text-slate-400">لا توجد مدارس مطابقة لهذا الفلتر المحدد حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-4 font-black text-center w-8">#</th>
                  <th className="p-4 font-black">اسم المدرسة والترخيص</th>
                  <th className="p-4 font-black">نوع الباقة</th>
                  <th className="p-4 font-black">المستخدمين / الحد</th>
                  <th className="p-4 font-black">التخزين المستهلك</th>
                  <th className="p-4 font-black">نهاية الاشتراك</th>
                  <th className="p-4 font-black">المتبقي</th>
                  <th className="p-4 font-black">الحالة</th>
                  <th className="p-4 font-black text-center">إجراءات الترخيص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSchools.map((school, idx) => {
                  const days = getDaysRemaining(school.subscriptionEnd);
                  const isSuspended = school.status === 'frozen' || school.status === 'suspended';
                  const isTrial = school.plan === 'Basic' || school.isTrial;
                  
                  // Limit indicators
                  const usersCount = school.usersCount || 0;
                  const userLimit = parseInt(school.userLimit || '1000');
                  const overUsers = usersCount > userLimit;

                  let remainingText = '';
                  let remainingColor = 'text-slate-300';
                  if (days < 0) {
                    remainingText = `منتهي منذ ${Math.abs(days)} يوم`;
                    remainingColor = 'text-red-500 font-extrabold';
                  } else if (days === 0) {
                    remainingText = 'ينتهي اليوم!';
                    remainingColor = 'text-red-500 font-black animate-pulse';
                  } else {
                    remainingText = `${days} يوم`;
                    if (days <= 7) remainingColor = 'text-orange-400 font-black';
                    else if (days <= 15) remainingColor = 'text-amber-400 font-bold';
                  }

                  return (
                    <tr key={school.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{school.logo || '🏫'}</span>
                          <div>
                            <div>{school.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">رقم العقد: {school.licenseNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black border ${
                          school.plan === 'Enterprise' 
                            ? 'bg-purple-950/30 text-purple-400 border-purple-900/60' 
                            : school.plan === 'Business' 
                            ? 'bg-orange-950/30 text-orange-400 border-orange-900/60' 
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {school.plan} {isTrial ? '(تجريبي)' : ''}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span className={overUsers ? 'text-red-400' : 'text-slate-300'}>
                          {usersCount}
                        </span>
                        <span className="text-slate-600 text-[10px]"> / {school.userLimit || '3000'}</span>
                        {overUsers && <span className="text-[8px] block text-red-500 font-bold">تجاوز الحد!</span>}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-300">
                        {school.storageUsed || '0 GB'}
                        <span className="text-slate-600 text-[10px]"> / {school.storageLimit || '500 GB'}</span>
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-400">
                        {school.subscriptionEnd || 'غير محدد'}
                      </td>
                      <td className={`p-4 font-mono ${remainingColor}`}>
                        {isSuspended ? '—' : remainingText}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          isSuspended 
                            ? 'bg-red-950/50 text-red-400 border-red-900' 
                            : days < 0 
                            ? 'bg-rose-950/40 text-rose-400 border-rose-900' 
                            : days <= 15 
                            ? 'bg-amber-950/40 text-amber-400 border-amber-900' 
                            : 'bg-emerald-950/50 text-emerald-400 border-emerald-900'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-red-500' : days < 0 ? 'bg-rose-500' : days <= 15 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {isSuspended ? 'موقف ومحجوب' : days < 0 ? 'منتهي الصلاحية' : days <= 15 ? 'بحاجة لمتابعة' : 'نشط وسليم'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setShowRenewModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-500 p-1.5 rounded-lg transition-all cursor-pointer border border-slate-700 text-[10px] font-bold"
                            title="تجديد الاشتراك"
                          >
                            تجديد
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setShowExtendModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition-all cursor-pointer border border-slate-700 text-[10px] font-bold"
                            title="تمديد استثنائي"
                          >
                            تمديد
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setShowPlanModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-purple-400 p-1.5 rounded-lg transition-all cursor-pointer border border-slate-700 text-[10px] font-bold"
                            title="تغيير الباقة والترخيص"
                          >
                            ترقية
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(school)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer border text-[10px] font-bold ${
                              isSuspended 
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900 hover:bg-emerald-900/30' 
                                : 'bg-red-950/40 text-red-400 border-red-900 hover:bg-red-900/30'
                            }`}
                            title={isSuspended ? 'إعادة تشغيل' : 'إيقاف مؤقت'}
                          >
                            {isSuspended ? 'تشغيل' : 'إيقاف'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setNoticeText(`نود تذكيركم بأن ترخيص المنصة الخاص بمدارسكم يوشك على الانتهاء خلال ${days} يوماً. يرجى سداد مستحقات الفاتورة المرفقة لعدم انقطاع الخدمة.`);
                              setShowNoticeModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-yellow-400 p-1.5 rounded-lg transition-all cursor-pointer border border-slate-700 text-[10px] font-bold"
                            title="إرسال إشعار"
                          >
                            إنذار
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- RENEW MODAL --- */}
      {showRenewModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-500 animate-spin-slow" />
              تجديد العقد والترخيص لـ: {selectedSchool.name}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سيتم تجديد اشتراك المستأجر وحساب تاريخ استحقاق جديد تلقائياً بناءً على فترة التجديد المحددة.
            </p>
            
            <div className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">فترة تجديد الترخيص السحابي</label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="3">3 شهور إضافية</option>
                  <option value="6">6 شهور إضافية</option>
                  <option value="12">سنة كاملة (12 شهراً) - باقة سنوية</option>
                  <option value="24">سنتين (24 شهراً) - باقة مؤسسات ممتدة</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRenew}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black py-2.5 transition-all cursor-pointer"
              >
                تجديد الاشتراك والفوترة 💳
              </button>
              <button
                onClick={() => setShowRenewModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 transition-all cursor-pointer border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXTEND MODAL --- */}
      {showExtendModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              تمديد ترخيص استثنائي ومؤقت
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              امنح المدرسة تمديداً استثنائياً للترخيص السحابي كفترة سماح لتفادي انقطاع العمليات الإدارية ريثما تتم فوترة الباقات الكبرى.
            </p>
            
            <div className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">فترة التمديد بالكامل (أيام)</label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="3">3 أيام تمديد</option>
                  <option value="7">أسبوع كامل (7 أيام سماح)</option>
                  <option value="15">15 يوماً (نصف شهر)</option>
                  <option value="30">30 يوماً (شهر كامل)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExtend}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black py-2.5 transition-all cursor-pointer"
              >
                اعتماد تمديد الترخيص ⏳
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 transition-all cursor-pointer border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PLAN MODAL --- */}
      {showPlanModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              تعديل الباقة والحدود لـ: {selectedSchool.name}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يرجى اختيار باقة الاشتراك المطلوبة للمدرسة. سيتم زيادة سعة تخزين S3 وحدود الكوادر والمستعملين تلقائياً.
            </p>
            
            <div className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">باقات الاستحقاق والاشتراك</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Basic">الباقة الأساسية (Basic) • حد 1000 مستخدم / 100 GB</option>
                  <option value="Business">الباقة المتطورة (Business) • حد 3000 مستخدم / 500 GB</option>
                  <option value="Enterprise">باقة المؤسسات الاحترافية (Enterprise) • حد 5000 مستخدم / 1 TB</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePlanChange}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black py-2.5 transition-all cursor-pointer"
              >
                تطبيق الباقة الجديدة وترقية الخوادم 🚀
              </button>
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 transition-all cursor-pointer border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTICE MODAL --- */}
      {showNoticeModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              إرسال إشعار ترخيص وتحذير للمدرسة
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سيتم إرسال هذا الإشعار والرسالة التحذيرية لمسؤولي مدرسة {selectedSchool.name} للتنبيه.
            </p>
            
            <div className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">طريقة الإرسال</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNoticeMethod('system')}
                    className={`flex-1 py-2 text-xs font-bold border transition-all ${
                      noticeMethod === 'system' 
                        ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400' 
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    إشعار فوري بالنظام 📲
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticeMethod('email')}
                    className={`flex-1 py-2 text-xs font-bold border transition-all ${
                      noticeMethod === 'email' 
                        ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400' 
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    بريد إلكتروني رسمي ✉️
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">نص الرسالة والإنذار</label>
                <textarea
                  rows={4}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendNotice}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-black py-2.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                إرسال الرسالة والتحذير الفوري
              </button>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 transition-all cursor-pointer border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
