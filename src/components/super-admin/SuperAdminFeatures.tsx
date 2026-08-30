import { Building2, Check, CheckCircle, Info, Save, Server, ShieldAlert, Sliders, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
interface SuperAdminFeaturesProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminFeatures({
  schools = [],
  setSchools,
  logAction,
  triggerNotification
}: SuperAdminFeaturesProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || '');

  useEffect(() => {
    if (!selectedSchoolId && schools[0]?.id) setSelectedSchoolId(schools[0].id);
  }, [schools, selectedSchoolId]);
  
  // Feature list definitions
  const featureDefinitions = [
    { key: 'students', name: 'شؤون الطلاب وأولياء الأمور والحضور', desc: 'تفعيل ملفات الطلاب وأولياء الأمور، كشوف الحضور والغياب اليومية' },
    { key: 'exams', name: 'الامتحانات وجداول الشهادات والنتائج', desc: 'تفعيل لوحة رصد الدرجات الأكاديمية والكنترول والشهادات والتقديرات' },
    { key: 'library', name: 'المكتبة المدرسية وفهارس الكتب والمطالعة', desc: 'تفعيل استعارة الكتب، وإدارة الفهارس الورقية والرقمية للطلاب والمعلمين' },
    { key: 'teachers', name: 'إدارة المعلمين والكادر الأكاديمي والتوظيف', desc: 'تفعيل شؤون الموظفين، عقود العمل، الرواتب والملفات الشخصية للأساتذة' },
    { key: 'accounts', name: 'الحسابات العامة وقيود اليومية المزدوجة والخزانة', desc: 'شجرة الحسابات، الدفاتر المحاسبية، قيود اليومية، الخزينة وصناديق الدفع' },
    { key: 'student_accounts', name: 'رسوم الطلاب والأقساط وفواتير الاستحقاق', desc: 'إصدار الفواتير المدرسية، جدولة أقساط السداد، وتحصيل الرسوم آلياً' },
    { key: 'inventory', name: 'إدارة المخزون والعهد والمستودعات الفروع', desc: 'تتبع المستودعات، الأصول الثابتة، وعهد الموظفين وصرف التجهيزات' },
    { key: 'buses', name: 'إدارة النقل والترحيل المدرسي', desc: 'إدارة الأسطول والمسارات والسائقين واشتراكات الطلاب وقوائم الركاب' },
    { key: 'uniform_management', name: 'إدارة الزي المدرسي', desc: 'الأصناف والمقاسات والقياسات والتوريد والمخزون وصرف الزي للطلاب' },
    { key: 'db_schema', name: 'لوحة مطور قاعدة البيانات ومولد الـ SQL', desc: 'مخططات الربط مع Supabase وتحميل السكيما الهيكلية للنظام' },
    { key: 'permissions_admin', name: 'إدارة المستخدمين وصلاحيات الـ RBAC المتطورة', desc: 'مصفوفة التعديل، تخصيص أدوار الكوادر وتدقيق امتثال السجلات' }
  ];

  // Get active school object
  const activeSchool = schools.find(s => s.id === selectedSchoolId);

  // Initialize or get features
  const getSchoolFeatures = () => {
    if (!activeSchool) return {};
    return activeSchool.features || {
      students: true,
      exams: true,
      library: true,
      teachers: true,
      accounts: true,
      student_accounts: true,
      inventory: true,
      buses: true,
      uniform_management: true,
      db_schema: true,
      permissions_admin: true
    };
  };

  const persistFeatures = async (features: Record<string, boolean>) => {
    const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(selectedSchoolId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'features', features }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.school) throw new Error(payload?.message || 'تعذر حفظ ميزات المدرسة مركزيًا.');
    return payload.school;
  };

  const applyCanonicalFeatures = (canonical: any) => {
    const features = canonical.central_metadata?.features || {};
    setSchools(prevSchools => prevSchools.map(s => s.id === canonical.id ? { ...s, features, central_metadata: canonical.central_metadata } : s));
  };

  const handleToggleFeature = async (featureKey: string) => {
    if (!selectedSchoolId) return;

    const currentFeatures = getSchoolFeatures();
    const updatedFeatures = {
      ...currentFeatures,
      [featureKey]: currentFeatures[featureKey] === false ? true : false
    };

    try {
      const canonical = await persistFeatures(updatedFeatures);
      applyCanonicalFeatures(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ الميزة مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    triggerNotification(`تم تحديث حالة الخدمة (${featureDefinitions.find(f => f.key === featureKey)?.name}) بنجاح`, 'info');
  };

  const handleSaveAllFeatures = async () => {
    if (!activeSchool) return;
    try {
      const canonical = await persistFeatures(getSchoolFeatures());
      applyCanonicalFeatures(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر اعتماد مصفوفة الميزات مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }
    
    logAction(
      'UPDATE_SCHOOL_FEATURES_MATRIX',
      `تعديل وتحديث مصفوفة الميزات والخدمات السحابية المفعَّلة لمدرسة ${activeSchool.name}`,
      'حوكمة الباقات والميزات'
    );
    triggerNotification(`✓ تم حفظ واعتماد مصفوفة الخدمات بنجاح لـ ${activeSchool.name}. تم تطبيق الخيارات حياً على شاشاتهم وجوانب التصفح لديهم فوراً!`, 'success');
  };

  const handleEnableAll = async () => {
    if (!selectedSchoolId) return;
    const allEnabled = {
      students: true,
      exams: true,
      library: true,
      teachers: true,
      accounts: true,
      student_accounts: true,
      inventory: true,
      buses: true,
      uniform_management: true,
      db_schema: true,
      permissions_admin: true
    };

    try {
      const canonical = await persistFeatures(allEnabled);
      applyCanonicalFeatures(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تفعيل الميزات مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    triggerNotification('تم تفعيل كافة ميزات المنظومة لـ ' + activeSchool?.name, 'success');
  };

  return (
    <div id="super-admin-features" className="space-y-6 text-right">
      
      {/* Selector Area */}
      <div className="bg-slate-900 border border-slate-800 p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">تخصيص ميزات المستأجرين (Feature Flags)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">قم بتفعيل أو تعطيل لوحات النظام حياً لمواءمة اشتراك المدرسة أو نوع الباقة المشتراة</p>
          </div>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="bg-slate-950 text-slate-100 border border-slate-800 p-2 text-xs font-bold focus:ring-1 focus:ring-amber-500"
          >
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.plan})</option>
            ))}
          </select>

          <button
            onClick={handleEnableAll}
            className="bg-amber-950 hover:bg-amber-900 border border-amber-900 text-amber-400 px-3 py-2 text-xs font-black transition-all cursor-pointer"
          >
            تفعيل الكل
          </button>
        </div>
      </div>

      {/* Main Grid: Features Control Card */}
      {activeSchool ? (
        <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white">تفصيل لوحات وميزات: <span className="text-amber-400">{activeSchool.name}</span></span>
            </div>
            <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-2.5 py-0.5 rounded font-bold uppercase">
              خطة الاشتراك: {activeSchool.plan}
            </span>
          </div>

          <div className="p-6 divide-y divide-slate-800/50 space-y-4">
            
            {/* Feature Flags Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-1">
              {featureDefinitions.map((feat) => {
                const isEnabled = getSchoolFeatures()[feat.key] !== false;
                return (
                  <div key={feat.key} className="flex items-start justify-between gap-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`} />
                        <h4 className="text-[11px] font-black text-slate-200">{feat.name}</h4>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed pl-3">{feat.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeature(feat.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isEnabled ? 'bg-amber-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-800">
              <div className="flex items-start gap-1.5 text-slate-400 max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[9px] leading-relaxed">
                  ملاحظة: تظهر الميزات فوراً في الجوانب واللوحات للمستخدمين والطلاب في تلك المدرسة، مما يمنعهم من الدخول إلى الصفحات والمجمعات المالية المغلقة.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAllFeatures}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-6 py-2.5 flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ واعتماد التغييرات حياً 💾</span>
              </button>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-8 bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          الرجاء اختيار مدرسة مستهدفة لعرض وتعديل باقة خدماتها السحابية.
        </div>
      )}

    </div>
  );
}
