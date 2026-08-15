import React, { useState } from 'react';
import { 
  Building2, DollarSign, TrendingUp, Wrench, ArrowRightLeft, 
  History, Paperclip, Barcode, Printer, Edit3, X, Save, 
  ShieldCheck, CheckCircle2, Calendar, Plus, UserCheck 
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface AssetDetailCardModalProps {
  asset: FixedAsset | null;
  onClose: () => void;
  onSaveAsset: (updated: FixedAsset) => void;
  onOpenTransferModal: (asset: FixedAsset) => void;
  onOpenMaintenanceModal: (asset: FixedAsset) => void;
  onOpenSaleModal: (asset: FixedAsset) => void;
  onOpenDiscardModal: (asset: FixedAsset) => void;
  onPostDepreciation: (assetId: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function AssetDetailCardModal({
  asset,
  onClose,
  onSaveAsset,
  onOpenTransferModal,
  onOpenMaintenanceModal,
  onOpenSaleModal,
  onOpenDiscardModal,
  onPostDepreciation,
  triggerNotification
}: AssetDetailCardModalProps) {
  if (!asset) return null;

  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'depreciation' | 'maintenance' | 'transfers' | 'timeline'>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FixedAsset>({ ...asset });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAsset(formData);
    setIsEditing(false);
    if (triggerNotification) {
      triggerNotification('✓ تم تحديث بيانات الأصل الثابت بنجاح', 'success');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
      <div className="rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="bg-[#2a1d13] text-[#fce79a] p-6 flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/30 text-amber-300 font-mono text-xs font-bold rounded-md border border-amber-500/30">
                {asset.code}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-md border border-emerald-500/30">
                {asset.status}
              </span>
            </div>
            <h3 className="text-xl font-black text-white">{asset.name}</h3>
            <p className="text-xs text-slate-300 font-semibold">{asset.category} | القسم: {asset.department} | المسؤول: {asset.responsible}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Key Metrics Bar */}
        <div className="bg-transparent border-b border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-right">
          <div>
            <span className="text-slate-400 font-bold block mb-0.5">التكلفة التاريخية:</span>
            <span className="font-mono text-sm font-bold text-slate-900">{Number(asset.cost).toLocaleString()} د.ل</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5">تحسين ورسملة:</span>
            <span className="font-mono text-sm font-bold text-slate-900">{Number(asset.capitalExp).toLocaleString()} د.ل</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5">مجمع الإهلاك:</span>
            <span className="font-mono text-sm font-bold text-rose-600">-{Number(asset.accDep).toLocaleString()} د.ل</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5">صافي القيمة الدفترية:</span>
            <span className="font-mono text-sm font-black text-emerald-700">{Number(asset.netValue).toLocaleString()} د.ل</span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onOpenTransferModal(asset)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> نقل الأصل
            </button>

            <button
              onClick={() => onOpenMaintenanceModal(asset)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" /> تسجيل صيانة
            </button>

            <button
              onClick={() => onPostDepreciation(asset.id)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> قيد الإهلاك السنوي
            </button>

            <button
              onClick={() => onOpenSaleModal(asset)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" /> بيع الأصل
            </button>

            <button
              onClick={() => onOpenDiscardModal(asset)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer"
            >
              تكهين وتخفيض
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> تعديل البيانات
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> حفظ
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 hover:bg-transparent text-slate-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> طباعة
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 flex flex-wrap px-4 gap-1">
          {[
            { id: 'basic', label: 'البيانات الأساسية', icon: Building2 },
            { id: 'financial', label: 'البيانات المالية والإهلاك', icon: DollarSign },
            { id: 'depreciation', label: 'سجل الإهلاك المرحل', icon: TrendingUp },
            { id: 'maintenance', label: 'سجل الصيانة', icon: Wrench },
            { id: 'transfers', label: 'سجل النقل والعهدة', icon: ArrowRightLeft },
            { id: 'timeline', label: 'سجل الحركة والنشاط (Timeline)', icon: History },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2.5 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
                  isActive ? 'border-amber-600 text-amber-700 shadow-xs' : 'border-transparent text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'basic' && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الكود التتبعي:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الباركود:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">التصنيف:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم الأصلالثابت:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المجموعة الفرعية:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المصنع / الشركة:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الموديل:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الرقم التسلسلي (Serial):</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.serialNo}
                    onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">القسم / الإدارة:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الموقع / المبنى:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المسؤول عن العهدة:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاريخ الشراء:</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المورد:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الفاتورة:</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    className="w-full p-2.5 bg-transparent font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">طريقة الإهلاك المحاسبي:</label>
                  <select
                    disabled={!isEditing}
                    value={formData.depMethod}
                    onChange={(e) => setFormData({ ...formData, depMethod: e.target.value as any })}
                    className="w-full p-2.5 bg-transparent font-bold"
                  >
                    <option value="قسط ثابت">قسط ثابت</option>
                    <option value="قسط متناقص">قسط متناقص</option>
                    <option value="وحدات الإنتاج">وحدات الإنتاج</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">العمر الإنتاجي (سنوات):</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={formData.usefulLife}
                    onChange={(e) => setFormData({ ...formData, usefulLife: Number(e.target.value) })}
                    className="w-full p-2.5 bg-transparent font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">القيمة التخريدية المقدرة:</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={formData.scrapValue}
                    onChange={(e) => setFormData({ ...formData, scrapValue: Number(e.target.value) })}
                    className="w-full p-2.5 bg-transparent font-bold font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-transparent space-y-3">
                <h5 className="font-bold text-slate-900 text-xs">التوجيه المحاسبي التلقائي بالدليل المالي:</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">حساب الأصل الثابت:</span>
                    <input type="text" readOnly value={formData.assetAccount || '130101'} className="w-full p-2 rounded-lg font-mono font-bold text-slate-800" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">حساب مجمع الإهلاك:</span>
                    <input type="text" readOnly value={formData.accDepAccount || '130102'} className="w-full p-2 rounded-lg font-mono font-bold text-slate-800" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">حساب مصروف الإهلاك:</span>
                    <input type="text" readOnly value={formData.depExpenseAccount || '520101'} className="w-full p-2 rounded-lg font-mono font-bold text-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'depreciation' && (
            <div className="space-y-3 text-xs">
              <h5 className="font-black text-slate-900 text-sm">قيود وتواريخ الإهلاك المرحلية</h5>
              {asset.depreciationHistory && asset.depreciationHistory.length > 0 ? (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-transparent text-slate-700 font-bold border-y border-slate-200">
                      <th className="p-2.5">السنة المالية</th>
                      <th className="p-2.5">رقم القيد (JV)</th>
                      <th className="p-2.5 text-left">قيمة الإهلاك</th>
                      <th className="p-2.5 text-left">مجمع الإهلاك بعد القيد</th>
                      <th className="p-2.5 text-left">القيمة الدفترية المتبقية</th>
                      <th className="p-2.5">المُرحِل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {asset.depreciationHistory.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{d.fiscalYear}</td>
                        <td className="p-2.5 font-bold text-amber-700">{d.jvNumber}</td>
                        <td className="p-2.5 text-left font-bold text-rose-600">{d.depreciationAmount.toLocaleString()} د.ل</td>
                        <td className="p-2.5 text-left">{d.accumulatedDepreciationAfter.toLocaleString()} د.ل</td>
                        <td className="p-2.5 text-left font-black text-emerald-700">{d.bookValueAfter.toLocaleString()} د.ل</td>
                        <td className="p-2.5 font-sans text-slate-600">{d.postedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-transparent border border-dashed border-slate-300 font-bold">
                  لم يتم ترحيل قيود إهلاك سابقة لهذا الأصل بعد.
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <h5 className="font-black text-slate-900 text-sm">سجل أعمال الصيانة والتطوير</h5>
                <button
                  onClick={() => onOpenMaintenanceModal(asset)}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> صيانة جديدة
                </button>
              </div>

              {asset.maintenanceLogs && asset.maintenanceLogs.length > 0 ? (
                <div className="space-y-3">
                  {asset.maintenanceLogs.map((m, idx) => (
                    <div key={idx} className="p-3.5 bg-transparent space-y-1">
                      <div className="flex justify-between items-start font-bold">
                        <span className="text-slate-900">{m.type} | المورد: {m.supplier}</span>
                        <span className="font-mono text-emerald-700">{m.cost.toLocaleString()} د.ل</span>
                      </div>
                      <p className="text-slate-600 font-semibold">{m.spareParts || m.notes}</p>
                      <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1">
                        <span>التاريخ: {m.date}</span>
                        <span>أمر العمل: {m.workOrderNo || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-transparent border border-dashed border-slate-300 font-bold">
                  لا توجد أعمال صيانة مسجلة لهذا الأصل.
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfers' && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <h5 className="font-black text-slate-900 text-sm">سجل نقل الموقع وتعديل العهدة</h5>
                <button
                  onClick={() => onOpenTransferModal(asset)}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> نقل جديد
                </button>
              </div>

              {asset.transferLogs && asset.transferLogs.length > 0 ? (
                <div className="space-y-3">
                  {asset.transferLogs.map((t, idx) => (
                    <div key={idx} className="p-3.5 bg-transparent space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>من: ({t.fromDept}) → إلى: ({t.toDept})</span>
                        <span className="font-mono text-slate-500">{t.date}</span>
                      </div>
                      <p className="text-slate-600 font-semibold">المسؤول الجديد: {t.toResponsible} | السبب: {t.reason}</p>
                      <div className="text-[10px] text-slate-400 font-mono pt-1">
                        اعتماد: {t.approvedBy}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-transparent border border-dashed border-slate-300 font-bold">
                  لا توجد حركات نقل مسجلة سابقة.
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4 text-xs">
              <h5 className="font-black text-slate-900 text-sm">السجل الزمني للأصل (Asset Timeline)</h5>
              {asset.timeline && asset.timeline.length > 0 ? (
                <div className="relative border-r-2 border-slate-200 pr-4 space-y-4 mr-2">
                  {asset.timeline.map((event, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <div className="absolute -right-[23px] top-1 w-3 h-3 bg-amber-600 rounded-full border-2 border-white"></div>
                      <div className="flex justify-between items-start font-bold">
                        <span className="text-slate-900">{event.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">{event.timestamp}</span>
                      </div>
                      <p className="text-slate-600 font-semibold">{event.description}</p>
                      <div className="text-[10px] text-slate-400">بواسطة: {event.user}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-transparent border border-dashed border-slate-300 font-bold">
                  لا توجد حركات زمنية موثقة بعد.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
