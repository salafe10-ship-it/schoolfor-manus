import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Lock, Save, Sliders } from 'lucide-react';

interface InventorySettingsProps {
  settings?: Record<string, any>;
  canEdit?: boolean;
  onSave?: (settings: Record<string, any>) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventorySettings({ settings: savedSettings, onSave, triggerNotification, canEdit = false }: InventorySettingsProps) {
  const [dirty, setDirty] = useState(false);
  const [settings, setSettings] = useState({
    enableLowStockAlerts: true,
    inventoryAccountPrefix: '1301',
    cogsAccountPrefix: '5270',
    adjustmentAccountPrefix: '5280',
    ...(savedSettings || {}),
    allowNegativeStock: false,
    defaultValuationMethod: 'weighted_average',
    requireApprovalForAdjustments: true,
    autoPostingToGL: true
  });
  useEffect(() => {
    if (!dirty && savedSettings) setSettings(previous => ({ ...previous, ...savedSettings, allowNegativeStock: false, defaultValuationMethod: 'weighted_average', requireApprovalForAdjustments: true, autoPostingToGL: true }));
  }, [savedSettings, dirty]);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { notify('لا تتوفر صلاحية تعديل الإعدادات.', 'warning'); return; }
    if (!onSave) { notify('حفظ الإعدادات متوقف حتى يتوفر المصدر المركزي.', 'warning'); return; }
    try { await onSave(settings); setDirty(false); notify('✓ تم حفظ إعدادات وسياسات إدارة المخزون مركزياً', 'success'); }
    catch (error: any) { notify(error?.message || 'تعذر حفظ إعدادات المخزون مركزياً', 'danger'); }
  };

  return (
    <div className="p-6 max-w-4xl space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" /> إعدادات وسياسات ضبط المخزون والمستودعات
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">تحديد القواعد التشغيلية والربط الدفتري مع دليل الحسابات الأستاذ العام</p>
      </div>

      {dirty && <p role="status">التعديلات المحلية محفوظة في النموذج أثناء التحديث.</p>}
      <form onSubmit={handleSave} onChange={() => setDirty(true)} className="space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6">
        {/* Operational Rules */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1">
            <Sliders className="w-4 h-4 text-amber-600" /> القواعد التشغيلية وسياسات الصرف
          </h4>

          <div className="space-y-3 bg-transparent p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-sm block">منع الرصيد السالب</span>
                <span className="text-xs text-slate-500">مفعل دائماً؛ لا يسمح النظام باعتماد صرف يتجاوز رصيد المستودع.</span>
              </div>
              <input type="checkbox" checked readOnly disabled className="w-5 h-5 accent-emerald-600 rounded" />
            </div>

            <label className="flex items-center justify-between cursor-pointer border-t border-slate-200 pt-3">
              <div>
                <span className="font-bold text-slate-800 text-sm block">الترحيل الكانوني إلى دفتر الأستاذ عند اعتماد الإذن</span>
                <span className="text-xs text-slate-500">ينشئ النظام قيداً مزدوجاً متوازناً فور اعتماد الاستلام أو الصرف أو تسوية الجرد، وتظهر هوية القيد على المستند.</span>
              </div>
              <input
                type="checkbox"
                checked
                readOnly
                disabled
                className="w-5 h-5 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer border-t border-slate-200 pt-3">
              <div>
                <span className="font-bold text-slate-800 text-sm block">اشتراط اعتماد التسويات الجردية</span>
                <span className="text-xs text-slate-500">كل محضر جرد ينتظر الاعتماد قبل تعديل الرصيد أو إنشاء أثر محاسبي.</span>
              </div>
              <input type="checkbox" checked readOnly disabled className="w-5 h-5 accent-emerald-600 rounded" />
            </label>
          </div>
        </div>

        {/* Valuation Policy */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">طريقة التقييم الافتراضية للمخزون (Inventory Valuation Method)</h4>
          <div className="p-4 border-2 border-emerald-200 bg-emerald-50/60">
            <span className="font-black text-slate-900 text-sm">المتوسط المرجح — الطريقة المنفذة حالياً</span>
            <p className="text-xs text-slate-600 mt-1">يعاد احتساب تكلفة الصنف عند الاستلام المقبول. FIFO غير متاح حتى إنشاء طبقات تكلفة ومخزون تاريخية قابلة للتدقيق.</p>
          </div>
        </div>

        {/* Accounting Accounts Defaults */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">أكواد الحسابات الافتراضية بدليل الحسابات</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب أصل المخزون</label>
              <input 
                type="text"
                value={settings.inventoryAccountPrefix}
                onChange={(e) => setSettings({ ...settings, inventoryAccountPrefix: e.target.value })}
                className="w-full p-2.5 bg-transparent font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب تكلفة الصرف/المبيعات</label>
              <input 
                type="text"
                value={settings.cogsAccountPrefix}
                onChange={(e) => setSettings({ ...settings, cogsAccountPrefix: e.target.value })}
                className="w-full p-2.5 bg-transparent font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب فروقات وتسويات الجرد</label>
              <input 
                type="text"
                value={settings.adjustmentAccountPrefix}
                onChange={(e) => setSettings({ ...settings, adjustmentAccountPrefix: e.target.value })}
                className="w-full p-2.5 bg-transparent font-mono text-sm font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button 
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> حفظ السياسات والإعدادات
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
