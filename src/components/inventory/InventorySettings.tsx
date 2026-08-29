import React, { useState } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Lock, Save, Sliders } from 'lucide-react';

interface InventorySettingsProps {
  settings?: Record<string, any>;
  onSave?: (settings: Record<string, any>) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventorySettings({ settings: savedSettings, onSave, triggerNotification }: InventorySettingsProps) {
  const [settings, setSettings] = useState({
    allowNegativeStock: false,
    defaultValuationMethod: 'weighted_average',
    autoPostingToGL: true,
    enableLowStockAlerts: true,
    requireApprovalForAdjustments: true,
    inventoryAccountPrefix: '110500',
    cogsAccountPrefix: '510100',
    adjustmentAccountPrefix: '',
    ...(savedSettings || {})
  });

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) { notify('حفظ الإعدادات متوقف حتى يتوفر المصدر المركزي.', 'warning'); return; }
    try { await onSave(settings); notify('✓ تم حفظ إعدادات وسياسات إدارة المخزون مركزياً', 'success'); }
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Operational Rules */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1">
            <Sliders className="w-4 h-4 text-amber-600" /> القواعد التشغيلية وسياسات الصرف
          </h4>

          <div className="space-y-3 bg-transparent p-4 border border-slate-200">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 text-sm block">السماح بالصرف على المكشوف (الرصيد السالب)</span>
                <span className="text-xs text-slate-500">حظر أي حركة صرف إذا كانت الكمية المتوفرة أقل من الصرف المطلوب لحماية سلامة المخزون</span>
              </div>
              <input 
                type="checkbox" 
                checked={settings.allowNegativeStock}
                onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })}
                className="w-5 h-5 accent-slate-900 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer border-t border-slate-200 pt-3">
              <div>
                <span className="font-bold text-slate-800 text-sm block">الترحيل الآلي إلى دفتر الأستاذ العام عند اعتماد الإذن</span>
                <span className="text-xs text-slate-500">توليد قيد اليومية تلقائياً فور اعتماد أذونات الإضافة والصرف والتسويات</span>
              </div>
              <input 
                type="checkbox" 
                checked={settings.autoPostingToGL}
                onChange={(e) => setSettings({ ...settings, autoPostingToGL: e.target.checked })}
                className="w-5 h-5 accent-slate-900 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer border-t border-slate-200 pt-3">
              <div>
                <span className="font-bold text-slate-800 text-sm block">اشتراط اعتماد المدير المالي لتسويات الجرد الفعلي</span>
                <span className="text-xs text-slate-500">عدم إحالة أي فروقات جرد بالزيادة أو العجز للدفاتر دون موافقة خطية بالصلاحية</span>
              </div>
              <input 
                type="checkbox" 
                checked={settings.requireApprovalForAdjustments}
                onChange={(e) => setSettings({ ...settings, requireApprovalForAdjustments: e.target.checked })}
                className="w-5 h-5 accent-slate-900 rounded"
              />
            </label>
          </div>
        </div>

        {/* Valuation Policy */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">طريقة التقييم الافتراضية للمخزون (Inventory Valuation Method)</h4>
          <div className="grid grid-cols-2 gap-4">
            <label className={`p-4 border-2 cursor-pointer transition ${
              settings.defaultValuationMethod === 'weighted_average' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <input 
                  type="radio" 
                  name="val_method"
                  value="weighted_average"
                  checked={settings.defaultValuationMethod === 'weighted_average'}
                  onChange={() => setSettings({ ...settings, defaultValuationMethod: 'weighted_average' })}
                  className="accent-slate-900"
                />
                <span className="font-black text-slate-900 text-sm">طريقة المتوسط المرجح (Weighted Average)</span>
              </div>
              <p className="text-xs text-slate-500">احتساب تكلفة الصنف عن طريق إعادة احتساب متوسط التكلفة مع كل شحنة توريد جديدة</p>
            </label>

            <label className={`p-4 border-2 cursor-pointer transition ${
              settings.defaultValuationMethod === 'fifo' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <input 
                  type="radio" 
                  name="val_method"
                  value="fifo"
                  checked={settings.defaultValuationMethod === 'fifo'}
                  onChange={() => setSettings({ ...settings, defaultValuationMethod: 'fifo' })}
                  className="accent-slate-900"
                />
                <span className="font-black text-slate-900 text-sm">طريقة الوارد أولاً يصرف أولاً (FIFO)</span>
              </div>
              <p className="text-xs text-slate-500">تسعير المنصرف حسب أقدم التكلفة المتوفرة وتكون التكلفة المتبقية قريبة من أسعار السوق</p>
            </label>
          </div>
        </div>

        {/* Accounting Accounts Defaults */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">بادئات وأكواد الحسابات الافتراضية بدليل الحسابات</h4>
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
      </form>
    </div>
  );
}
