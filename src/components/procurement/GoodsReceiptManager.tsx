import React, { useState } from 'react';
import { 
  Truck, Plus, CheckCircle2, AlertTriangle, ShieldCheck, 
  Search, FileText, ArrowUpRight, DollarSign, Check, XCircle 
} from 'lucide-react';
import { GoodsReceiptNote, GoodsReceiptStatus, PurchaseOrder } from '../../types';

interface GoodsReceiptManagerProps {
  receipts: GoodsReceiptNote[];
  orders: PurchaseOrder[];
  onSaveReceipt: (grn: GoodsReceiptNote) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function GoodsReceiptManager({
  receipts,
  orders,
  onSaveReceipt,
  triggerNotification
}: GoodsReceiptManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>('المستخدم الحالي');
  const [inspectionResult, setInspectionResult] = useState<'passed' | 'conditional_pass' | 'failed'>('passed');
  const [deliveryNoteNo, setDeliveryNoteNo] = useState<string>(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const selectedPO = orders.find(o => o.id === selectedPoId) || orders[0];

  const handleOpenNew = () => {
    if (orders.length > 0) {
      setSelectedPoId(orders[0].id);
    }
    setShowModal(true);
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    const sourceLine = selectedPO.lines[0];
    if (!sourceLine) {
      triggerNotification?.('لا يمكن إنشاء إذن استلام لأمر شراء بلا بنود موثقة', 'warning');
      return;
    }
    if (!Number.isFinite(receivedQty) || receivedQty <= 0 || !Number.isFinite(rejectedQty) || rejectedQty < 0 || rejectedQty > receivedQty) {
      triggerNotification?.('أدخل كمية مستلمة موجبة، ويجب ألا تتجاوز الكمية المرفوضة الكمية المستلمة', 'warning');
      return;
    }
    const unitCost = sourceLine.actualUnitPrice ?? sourceLine.estimatedUnitPrice ?? 0;
    const acceptedQty = receivedQty - rejectedQty;
    const totalValue = acceptedQty * unitCost;

    const newGRN: GoodsReceiptNote = {
      id: `grn_${Date.now()}`,
      schoolId: '',
      grnNo: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
      grnDate: new Date().toISOString().split('T')[0],
      purchaseOrderId: selectedPO.id,
      poNo: selectedPO.poNo,
      vendorId: selectedPO.vendorId,
      vendorName: selectedPO.vendorName,
      deliveryNoteNo,
      warehouseId: selectedPO.warehouseId,
      inspectorName,
      inspectionResult,
      status: inspectionResult === 'failed' ? 'rejected' : inspectionResult === 'conditional_pass' ? 'partially_accepted' : 'inspected_received',
      lines: [
        {
          lineId: `grnl_${Date.now()}`,
          itemId: sourceLine.itemId,
          itemCode: sourceLine.itemCode,
          itemName: sourceLine.itemName,
          orderedQty: sourceLine.quantityOrdered ?? sourceLine.quantityRequested,
          receivedQty,
          acceptedQty,
          rejectedQty,
          rejectionReason,
          unitCost,
          totalCost: totalValue
        }
      ],
      totalReceivedValue: totalValue,
      isPostedToGL: false,
      notes: 'تم فحص الشحنة وحفظ محضر الاستلام؛ الترحيل المالي يتطلب تكامل دفتر الأستاذ.',
      createdAt: new Date().toISOString()
    };

    try {
      await onSaveReceipt(newGRN);
      triggerNotification?.(`✓ تم حفظ إذن الاستلام والفحص (${newGRN.grnNo}) مركزياً؛ لم يُنشأ قيد مالي`, 'success');
      setShowModal(false);
    } catch (error: any) { triggerNotification?.(error?.message || 'تعذر حفظ محضر الاستلام مركزياً', 'danger'); }
  };

  const filtered = receipts.filter(r => 
    r.grnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.poNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="goods-receipt-manager">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" /> الفحص وإذونات الاستلام المخزني (Goods Receipt Notes - GRN)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">مطابقة الكميات الواردة من الموردين، الفحص الفني، إدخال الأصناف للمستودع وترحيل القيود الآلية</p>
        </div>

        <button 
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> تسجيل إذن استلام وفحص جديد (GRN)
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم إذن الاستلام، رقم أمر الشراء، اسم المورد..." 
            className="w-full pr-10 pl-4 py-2 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-4">رقم إذن الاستلام</th>
                <th className="px-4 py-4">تاريخ الاستلام</th>
                <th className="px-4 py-4">أمر الشراء المرتبط</th>
                <th className="px-4 py-4">المورد</th>
                <th className="px-4 py-4">نتيجة الفحص الفني</th>
                <th className="px-4 py-4">القيمة الاستلامية</th>
                <th className="px-4 py-4">حالة التكامل المحاسبي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filtered.map((grn) => (
                <tr key={grn.id} className="hover:bg-transparent transition">
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">{grn.grnNo}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">{grn.grnDate}</td>
                  <td className="px-4 py-4 font-mono text-xs font-bold text-amber-700">{grn.poNo}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{grn.vendorName}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 border rounded-lg text-xs font-bold inline-flex items-center gap-1 ${grn.inspectionResult === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {grn.inspectionResult === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {grn.inspectionResult === 'failed' ? 'مرفوض' : grn.inspectionResult === 'conditional_pass' ? 'قبول مشروط' : 'مقبول ومفحوص'}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-black text-emerald-700">{grn.totalReceivedValue.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-md">
                      {grn.isPostedToGL && grn.glJournalEntryId ? grn.glJournalEntryId : 'لم يُرحّل — ينتظر دفتر الأستاذ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-2xl w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" /> إثبات فحص واستلام الأصناف (GRN)
            </h3>

            <form onSubmit={handleCreateGRN} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر أمر الشراء المرتبط (PO) *</label>
                <select 
                  value={selectedPoId}
                  onChange={(e) => setSelectedPoId(e.target.value)}
                  className="w-full p-2.5 bg-transparent text-sm font-bold text-slate-800"
                >
                  {orders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNo} - {po.vendorName} ({po.grandTotal.toLocaleString('ar-SA')} د.ل)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم إشعار الشحن/التسليم للمورد</label>
                  <input 
                    type="text"
                    required
                    value={deliveryNoteNo}
                    onChange={(e) => setDeliveryNoteNo(e.target.value)}
                    className="w-full p-2.5 bg-transparent text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المفتش المسؤول/أمين المستودع</label>
                  <input 
                    type="text"
                    required
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full p-2.5 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المرفوضة</label>
                  <input type="number" min="0" max={receivedQty} value={rejectedQty} onChange={e => setRejectedQty(Number(e.target.value))} className="w-full p-2.5 bg-transparent text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سبب الرفض/الملاحظات</label>
                  <input type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full p-2.5 bg-transparent text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المقبولة المستلمة فعلياً</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-transparent text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نتيجة الفحص الفني</label>
                  <select 
                    value={inspectionResult}
                    onChange={(e: any) => setInspectionResult(e.target.value)}
                    className="w-full p-2.5 bg-transparent text-sm font-bold text-slate-800"
                  >
                    <option value="passed">مقبول ومقيد للمخزن بالكامل</option>
                    <option value="conditional_pass">قبول مشروط مع ملاحظات</option>
                    <option value="failed">مرفوض بالكامل لعدم المطابقة</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-100 text-xs space-y-1">
                <span className="font-bold text-amber-900 block flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> فصل الاستلام المخزني عن الترحيل المالي
                </span>
                <p className="text-slate-600">
                  يحفظ النظام محضر الفحص ويحدّث الكمية المقبولة فقط. لا يُنشأ قيد يومية من هذه الشاشة؛ الترحيل يتطلب تكامل دفتر الأستاذ وخرائط الحسابات المعتمدة.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm shadow-sm"
                >
                  حفظ وتأكيد الاستلام بالمخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
