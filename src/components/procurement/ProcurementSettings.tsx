import React, { useState } from 'react';
import { Settings, ShieldCheck, DollarSign, Layers, Save, CheckCircle2 } from 'lucide-react';

interface ProcurementSettingsProps {
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function ProcurementSettings({ triggerNotification }: ProcurementSettingsProps) {
  const [managerApprovalLimit, setManagerApprovalLimit] = useState<number>(50000);
  const [boardApprovalLimit, setBoardApprovalLimit] = useState<number>(200000);
  const [requireRfqThreshold, setRequireRfqThreshold] = useState<number>(20000);
  const [apGlAccount, setApGlAccount] = useState<string>('210101 - حسابات الموردين دائنون (AP)');
  const [grniGlAccount, setGrniGlAccount] = useState<string>('210102 - البضاعة المستلمة غير المفوترة (GRNI)');
  const [purchaseExpenseAccount, setPurchaseExpenseAccount] = useState<string>('510201 - مصروفات المشتريات والمستلزمات');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerNotification) {
      triggerNotification('✓ تم حفظ إعدادات وسقوف اعتمادات المشتريات والربط مع الحسابات العامة بنجاح', 'success');
    }
  };

  return (
    <div className="space-y-6" id="procurement-settings">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" /> إعدادات حوكمة المشتريات وسقوف الاعتماد (Procurement Governance)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">تحديد صلاحيات واعتمادات المبالغ، وقواعد الربط المحاسبي التلقائي</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Approval Thresholds Card */}
        <div className="p-6 space-y-4">
          <h4 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" /> سقوف صلاحيات الاعتماد المالي
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حد اعتماد المدير المالي (د.ل)</label>
              <input 
                type="number"
                value={managerApprovalLimit}
                onChange={(e) => setManagerApprovalLimit(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-transparent text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حد اعتماد مجلس الإدارة (د.ل)</label>
              <input 
                type="number"
                value={boardApprovalLimit}
                onChange={(e) => setBoardApprovalLimit(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-transparent text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حد الإلزام بتقديم 3 عروض أسعار RFQ (د.ل)</label>
              <input 
                type="number"
                value={requireRfqThreshold}
                onChange={(e) => setRequireRfqThreshold(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-transparent text-sm font-bold"
              />
            </div>
          </div>
        </div>

        {/* GL Mapping Card */}
        <div className="p-6 space-y-4">
          <h4 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> توجيه القيود المحاسبية الآلية بالدليل المالي
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب دائنو المشتريات (Accounts Payable)</label>
              <input 
                type="text"
                value={apGlAccount}
                onChange={(e) => setApGlAccount(e.target.value)}
                className="w-full p-2.5 bg-transparent text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب البضاعة المستلمة غير المفوترة (GRNI)</label>
              <input 
                type="text"
                value={grniGlAccount}
                onChange={(e) => setGrniGlAccount(e.target.value)}
                className="w-full p-2.5 bg-transparent text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب مصروفات المشتريات العامة</label>
              <input 
                type="text"
                value={purchaseExpenseAccount}
                onChange={(e) => setPurchaseExpenseAccount(e.target.value)}
                className="w-full p-2.5 bg-transparent text-sm font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> حفظ الإعدادات وقواعد التوجيه
          </button>
        </div>
      </form>
    </div>
  );
}
