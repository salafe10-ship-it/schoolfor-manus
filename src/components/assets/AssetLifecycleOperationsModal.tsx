import React, { useState } from 'react';
import { 
  Building2, Plus, ArrowRightLeft, Wrench, Calendar, 
  DollarSign, Trash2, X, Save, CheckCircle2, ShieldCheck, Layers 
} from 'lucide-react';
import { FixedAsset } from '../../types';

interface AssetLifecycleOperationsModalProps {
  modalType: 'none' | 'new_asset' | 'transfer' | 'maintenance' | 'depreciation' | 'sale' | 'discard';
  targetAsset: FixedAsset | null;
  assets: FixedAsset[];
  onClose: () => void;
  onSaveNewAsset: (asset: FixedAsset) => void;
  onConfirmTransfer: (assetId: string, log: any) => void;
  onConfirmMaintenance: (assetId: string, log: any) => void;
  onConfirmDepreciation: (assetId: string, fiscalYear: string) => void;
  onConfirmSale: (assetId: string, price: number, buyer: string, notes: string) => void;
  onConfirmDiscard: (assetId: string, notes: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function AssetLifecycleOperationsModal({
  modalType,
  targetAsset,
  assets,
  onClose,
  onSaveNewAsset,
  onConfirmTransfer,
  onConfirmMaintenance,
  onConfirmDepreciation,
  onConfirmSale,
  onConfirmDiscard,
  triggerNotification
}: AssetLifecycleOperationsModalProps) {
  if (modalType === 'none') return null;

  // State for New Asset Form
  const [newAssetData, setNewAssetData] = useState<Partial<FixedAsset>>({
    code: '',
    barcode: '',
    name: '',
    category: 'أثاث وتجهيزات مدرسية',
    group: 'الأثاث والتجهيزات',
    manufacturer: '',
    model: '',
    serialNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    invoiceNo: '',
    cost: 0,
    capitalExp: 0,
    scrapValue: 0,
    usefulLife: 0,
    depRate: '',
    depMethod: 'قسط ثابت',
    depStartDate: '',
    assetAccount: '',
    accDepAccount: '',
    depExpenseAccount: '',
    accDep: 0,
    netValue: 0,
    isDepPaused: false,
    status: 'نشط / قيد التشغيل',
    department: 'الإدارة العامة',
    branch: 'الفرع الرئيسي - طرابلس',
    location: 'المبنى الإداري - الدور الأول',
    responsible: ''
  });

  // State for Transfer
  const [transferData, setTransferData] = useState({
    fromDept: targetAsset?.department || '',
    toDept: '',
    fromBranch: targetAsset?.branch || '',
    toBranch: '',
    fromResponsible: targetAsset?.responsible || '',
    toResponsible: '',
    reason: '',
    approvedBy: '',
    notes: ''
  });

  // State for Maintenance
  const [maintenanceData, setMaintenanceData] = useState({
    type: 'دورية' as 'دورية' | 'طارئة' | 'ترميم وتحسين',
    cost: 0,
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    nextDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    statusAfter: 'ممتاز',
    workOrderNo: '',
    spareParts: '',
    notes: ''
  });

  // State for Depreciation
  const [fiscalYear, setFiscalYear] = useState('2026');

  // State for Sale
  const [salePrice, setSalePrice] = useState<number>(0);
  const [buyerName, setBuyerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // State for Discard
  const [discardNotes, setDiscardNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
      <div className="rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              {modalType === 'new_asset' && <Building2 className="w-5 h-5" />}
              {modalType === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
              {modalType === 'maintenance' && <Wrench className="w-5 h-5" />}
              {modalType === 'depreciation' && <Calendar className="w-5 h-5" />}
              {modalType === 'sale' && <DollarSign className="w-5 h-5" />}
              {modalType === 'discard' && <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                {modalType === 'new_asset' && 'تسجيل ورسملة أصل جديد (New Asset Capitalization)'}
                {modalType === 'transfer' && `نقل الأصل والعهدة: ${targetAsset?.name}`}
                {modalType === 'maintenance' && `تسجيل صيانة وأمر عمل: ${targetAsset?.name}`}
                {modalType === 'depreciation' && `احتساب وقيد الإهلاك المحاسبي: ${targetAsset ? targetAsset.name : 'جميع الأصول'}`}
                {modalType === 'sale' && `إثبات بيع الأصل الثابت: ${targetAsset?.name}`}
                {modalType === 'discard' && `تكهين واستبعاد الأصل: ${targetAsset?.name}`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">توثيق كافة الحركات بالدورة المحاسبية وسجل الرقابة (Audit Trail)</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY 1: NEW ASSET */}
        {modalType === 'new_asset' && (
          <form onSubmit={(e) => {
            e.preventDefault();
    const cost = Number(newAssetData.cost || 0);
    const capitalExp = Number(newAssetData.capitalExp || 0);
            if (!newAssetData.code || !newAssetData.barcode || !newAssetData.name || !newAssetData.supplier || !newAssetData.invoiceNo || cost + capitalExp <= 0 || !Number.isFinite(cost + capitalExp)) {
              triggerNotification?.('يرجى إدخال رمز الأصل والباركود والاسم والمورد ورقم الفاتورة وتكلفة موجبة قبل الرسملة.', 'warning');
              return;
            }
            const created: FixedAsset = {
              id: `FA-${Date.now()}`,
              code: newAssetData.code,
              barcode: newAssetData.barcode,
              name: newAssetData.name,
              category: newAssetData.category || 'أثاث وتجهيزات مدرسية',
              group: newAssetData.group || 'الأثاث المدرسي',
              manufacturer: newAssetData.manufacturer || '',
              model: newAssetData.model || '',
              serialNo: newAssetData.serialNo || '',
              purchaseDate: newAssetData.purchaseDate || new Date().toISOString().split('T')[0],
              supplier: newAssetData.supplier,
              invoiceNo: newAssetData.invoiceNo,
              cost,
              capitalExp,
              scrapValue: Number(newAssetData.scrapValue || 0),
              usefulLife: Number(newAssetData.usefulLife || 5),
              depRate: newAssetData.depRate || '20%',
              depMethod: newAssetData.depMethod || 'قسط ثابت',
              depStartDate: newAssetData.depStartDate || '2026-07-01',
              assetAccount: newAssetData.assetAccount || '130101',
              accDepAccount: newAssetData.accDepAccount || '130102',
              depExpenseAccount: newAssetData.depExpenseAccount || '520101',
              accDep: 0,
              netValue: cost + capitalExp,
              isDepPaused: false,
              status: 'نشط / قيد التشغيل',
              department: newAssetData.department || 'الإدارة العامة',
              branch: newAssetData.branch || 'الفرع الرئيسي - طرابلس',
              location: newAssetData.location || 'المبنى الرئيسي',
              responsible: newAssetData.responsible || 'أ. خالد المفتي',
              maintenanceLogs: [],
              transferLogs: [],
              depreciationHistory: [],
              timeline: [{
                id: `tl_${Date.now()}`,
                timestamp: new Date().toLocaleString('ar-LY'),
                type: 'creation',
                title: 'تسجيل أصل مالي ورسملته بالشراء',
                description: `تم إضافة الأصل القيمة: ${(cost + capitalExp).toLocaleString()} د.ل`,
                user: 'المدير المالي'
              }],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            onSaveNewAsset(created);
            onClose();
          }} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">كود التتبع:</label>
                <input type="text" value={newAssetData.code} onChange={e => setNewAssetData({...newAssetData, code: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الباركود:</label>
                <input type="text" value={newAssetData.barcode} onChange={e => setNewAssetData({...newAssetData, barcode: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">التصنيف الرئيسي:</label>
                <select value={newAssetData.category} onChange={e => setNewAssetData({...newAssetData, category: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold">
                  <option value="سيارات وحافلات">سيارات وحافلات</option>
                  <option value="أجهزة ومعدات مختبرية">أجهزة ومعدات مختبرية</option>
                  <option value="أثاث وتجهيزات مدرسية">أثاث وتجهيزات مدرسية</option>
                  <option value="أجهزة ومولدات طاقة">أجهزة ومولدات طاقة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الأصلالثابت:</label>
                <input type="text" required placeholder="أدخل اسم الأصل..." value={newAssetData.name} onChange={e => setNewAssetData({...newAssetData, name: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">المجموعة الفرعية:</label>
                <input type="text" value={newAssetData.group} onChange={e => setNewAssetData({...newAssetData, group: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">التكلفة التاريخية (د.ل):</label>
                <input type="number" required value={newAssetData.cost} onChange={e => setNewAssetData({...newAssetData, cost: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold text-emerald-700" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">العمر الإنتاجي (سنوات):</label>
                <input type="number" value={newAssetData.usefulLife} onChange={e => setNewAssetData({...newAssetData, usefulLife: parseInt(e.target.value) || 1})} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">القيمة التخريدية (د.ل):</label>
                <input type="number" value={newAssetData.scrapValue} onChange={e => setNewAssetData({...newAssetData, scrapValue: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold" />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center gap-1.5">
                <Save className="w-4 h-4" /> حفظ ورسملة الأصل
              </button>
            </div>
          </form>
        )}

        {/* MODAL BODY 2: TRANSFER */}
        {modalType === 'transfer' && targetAsset && (
          <form onSubmit={(e) => {
            e.preventDefault();
            onConfirmTransfer(targetAsset.id, transferData);
            onClose();
          }} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 block">بيانات الأصل المنقول:</span>
              <p className="text-amber-800 font-semibold">{targetAsset.name} ({targetAsset.code}) | القسم الحالي: {targetAsset.department}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">القسم المستلم الجديد:</label>
                <input type="text" required value={transferData.toDept} onChange={e => setTransferData({...transferData, toDept: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المسؤول عن العهدة الجديد:</label>
                <input type="text" required value={transferData.toResponsible} onChange={e => setTransferData({...transferData, toResponsible: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">سبب النقل والملاحظات:</label>
              <textarea required value={transferData.reason} onChange={e => setTransferData({...transferData, reason: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold h-20" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" /> تأكيد حركة النقل
              </button>
            </div>
          </form>
        )}

        {/* MODAL BODY 3: MAINTENANCE */}
        {modalType === 'maintenance' && targetAsset && (
          <form onSubmit={(e) => {
            e.preventDefault();
            onConfirmMaintenance(targetAsset.id, maintenanceData);
            onClose();
          }} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الصيانة:</label>
                <select value={maintenanceData.type} onChange={e => setMaintenanceData({...maintenanceData, type: e.target.value as any})} className="w-full p-2 bg-transparent rounded-lg font-bold">
                  <option value="دورية">صيانة دورية</option>
                  <option value="طارئة">صيانة طارئة</option>
                  <option value="ترميم وتحسين">ترميم وتحسين رأسمالي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تكلفت الصيانة (د.ل):</label>
                <input type="number" required min="0.01" value={maintenanceData.cost} onChange={e => setMaintenanceData({...maintenanceData, cost: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold text-emerald-700" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد / الورشة:</label>
                <input type="text" value={maintenanceData.supplier} onChange={e => setMaintenanceData({...maintenanceData, supplier: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">قطع الغيار وأعمال الصيانة المنفذة:</label>
              <textarea value={maintenanceData.spareParts} onChange={e => setMaintenanceData({...maintenanceData, spareParts: e.target.value})} className="w-full p-2 bg-transparent rounded-lg font-bold h-20" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> حفظ أمر الصيانة
              </button>
            </div>
          </form>
        )}

        {/* MODAL BODY 4: DEPRECIATION */}
        {modalType === 'depreciation' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (targetAsset) {
              onConfirmDepreciation(targetAsset.id, fiscalYear);
            } else {
              assets.forEach(a => {
                if (a.status === 'نشط / قيد التشغيل' && !a.isDepPaused) {
                  onConfirmDepreciation(a.id, fiscalYear);
                }
              });
            }
            onClose();
          }} className="space-y-4 text-xs">
            <div className="p-4 bg-transparent space-y-2">
              <span className="font-bold text-slate-900 block">تأكيد احتساب وقيد الاستهلاك المحاسبي:</span>
              <p className="text-slate-600 font-semibold">
                سيقوم النظام باحتساب القسط السنوي وتحديث مجمع الإهلاك والقيمة الدفترية وإنشاء قيد دفتر اليومية العامة (JV) تلقائياً للسنة المالية ({fiscalYear}).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">السنة المالية المستهدفة:</label>
              <input type="text" value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="w-full p-2.5 bg-transparent font-mono font-bold text-slate-900 text-center" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" /> ترحيل الإهلاك المحاسبي
              </button>
            </div>
          </form>
        )}

        {/* MODAL BODY 5: SALE */}
        {modalType === 'sale' && targetAsset && (
          <form onSubmit={(e) => {
            e.preventDefault();
            onConfirmSale(targetAsset.id, salePrice, buyerName, saleNotes);
            onClose();
          }} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-900 block">صافي القيمة الدفترية للأصل:</span>
              <span className="font-mono text-sm font-black text-emerald-700">{targetAsset.netValue.toLocaleString()} د.ل</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">سعر البيع المقبوض (د.ل):</label>
                <input type="number" required min="0.01" value={salePrice} onChange={e => setSalePrice(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-transparent rounded-lg font-mono font-bold text-emerald-700" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">جهة / اسم المشتري:</label>
                <input type="text" required value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full p-2 bg-transparent rounded-lg font-bold" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الملاحظات وسند التصفية:</label>
              <textarea value={saleNotes} onChange={e => setSaleNotes(e.target.value)} className="w-full p-2 bg-transparent rounded-lg font-bold h-20" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> تأكيد عملية البيع
              </button>
            </div>
          </form>
        )}

        {/* MODAL BODY 6: DISCARD */}
        {modalType === 'discard' && targetAsset && (
          <form onSubmit={(e) => {
            e.preventDefault();
            onConfirmDiscard(targetAsset.id, discardNotes);
            onClose();
          }} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 space-y-1">
              <span className="font-bold text-rose-900 block">تنبيه تكهين واستبعاد أصل:</span>
              <p className="text-rose-800 font-semibold">سيتم شطب القيمة الدفترية المتبقية ({targetAsset.netValue.toLocaleString()} د.ل) وتحويل الأصل لحالة "مستبعد".</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">سبب الاستبعاد والتكهين:</label>
              <textarea value={discardNotes} onChange={e => setDiscardNotes(e.target.value)} className="w-full p-2 bg-transparent rounded-lg font-bold h-20" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 text-white font-bold flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> تأكيد التكهين والشطب
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
