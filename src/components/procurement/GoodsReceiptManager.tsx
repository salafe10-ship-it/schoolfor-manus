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
  const [deliveryNoteNo, setDeliveryNoteNo] = useState<string>('');
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [rejectedQuantities, setRejectedQuantities] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const eligibleOrders = orders.filter(order => ['approved', 'issued', 'partially_received'].includes(order.status));
  const selectedPO = eligibleOrders.find(o => o.id === selectedPoId);
  const selectedSourceLines = selectedPO?.lines || [];
  const lineKey = (line: any, index: number) => String(line.id || line.itemId || line.itemCode || index);
  const remainingByLine = selectedSourceLines.reduce<Record<string, number>>((result, line, index) => {
    const key = lineKey(line, index);
    const itemId = line.itemId || line.itemCode;
    const ordered = Number(line.quantityOrdered ?? line.quantityRequested ?? 0);
    const received = selectedPO ? receipts.filter(receipt => receipt.purchaseOrderId === selectedPO.id).reduce((sum, receipt) => sum + receipt.lines
      .filter(receiptLine => (receiptLine.itemId || receiptLine.itemCode) === itemId)
      .reduce((lineSum, receiptLine) => lineSum + Number(receiptLine.receivedQty || 0), 0), 0) : 0;
    result[key] = Math.max(0, ordered - received);
    return result;
  }, {});
  const remainingQty = Object.values(remainingByLine).reduce((sum, quantity) => sum + quantity, 0);

  const handleOpenNew = () => {
    if (eligibleOrders.length === 0) {
      triggerNotification?.('لا يوجد أمر شراء معتمد ومفتوح للاستلام حالياً.', 'warning');
      return;
    }
    setSelectedPoId(eligibleOrders[0].id);
    setReceivedQuantities({});
    setRejectedQuantities({});
    setDeliveryNoteNo('');
    setShowModal(true);
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) {
      triggerNotification?.('اختر أمراً معتمداً ومفتوحاً للاستلام.', 'warning');
      return;
    }
    if (!selectedSourceLines.length) {
      triggerNotification?.('لا يمكن إنشاء إذن استلام لأمر شراء بلا بنود موثقة', 'warning');
      return;
    }
    const invalidLine = selectedSourceLines.some((line, index) => {
      const key = lineKey(line, index);
      const received = Number(receivedQuantities[key] || 0);
      const rejected = Number(rejectedQuantities[key] || 0);
      return !Number.isInteger(received) || received < 0 || received > remainingByLine[key]
        || !Number.isInteger(rejected) || rejected < 0 || rejected > received;
    });
    const hasReceivedLine = selectedSourceLines.some((line, index) => Number(receivedQuantities[lineKey(line, index)] || 0) > 0);
    if (!deliveryNoteNo.trim() || !inspectorName.trim() || !hasReceivedLine || invalidLine) {
      triggerNotification?.('أدخل كمية واردة لبند واحد على الأقل، ولا تتجاوز المتبقي، مع ضبط الكمية المرفوضة ضمن الواردة.', 'warning');
      return;
    }
    const grnLines = selectedSourceLines.map((sourceLine, index) => {
      const key = lineKey(sourceLine, index);
      const received = Number(receivedQuantities[key] || 0);
      const rejected = Number(rejectedQuantities[key] || 0);
      const unitCost = Number(sourceLine.actualUnitPrice ?? sourceLine.estimatedUnitPrice ?? 0);
      const accepted = inspectionResult === 'failed' ? 0 : received - rejected;
      const effectiveRejected = inspectionResult === 'failed' ? received : rejected;
      return {
        lineId: `grnl_${Date.now()}_${index}`,
        itemId: sourceLine.itemId || sourceLine.itemCode,
        itemCode: sourceLine.itemCode,
        itemName: sourceLine.itemName,
        orderedQty: sourceLine.quantityOrdered ?? sourceLine.quantityRequested,
        receivedQty: received,
        acceptedQty: accepted,
        rejectedQty: effectiveRejected,
        rejectionReason: inspectionResult === 'failed' ? (rejectionReason.trim() || 'رفض كامل بعد الفحص الفني') : rejectionReason.trim(),
        unitCost,
        totalCost: accepted * unitCost
      };
    }).filter(line => line.receivedQty > 0);
    const totalValue = grnLines.reduce((sum, line) => sum + line.totalCost, 0);

    const newGRN: GoodsReceiptNote = {
      id: `grn_${Date.now()}`,
      schoolId: '',
      grnNo: `GRN-${Date.now()}`,
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
      lines: grnLines,
      totalReceivedValue: totalValue,
      isPostedToGL: false,
      notes: 'تم فحص الشحنة وحفظ محضر الاستلام؛ أضيفت الكمية المقبولة فقط، ويُنشئ الخادم قيد الاستلام الكانوني عند جاهزية دفتر الأستاذ.',
      createdAt: new Date().toISOString()
    };

    try {
      await onSaveReceipt(newGRN);
      triggerNotification?.(`✓ تم حفظ إذن الاستلام والفحص (${newGRN.grnNo}) مركزياً وإحالته إلى الترحيل الكانوني.`, 'success');
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
                      {grn.isPostedToGL && grn.glJournalEntryId ? `مرحل: ${grn.glJournalEntryId}` : 'بانتظار جاهزية دفتر الأستاذ'}
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
                  onChange={(e) => { setSelectedPoId(e.target.value); setReceivedQuantities({}); setRejectedQuantities({}); setRejectionReason(''); }}
                  className="w-full p-2.5 bg-transparent text-sm font-bold text-slate-800"
                >
                  {eligibleOrders.map((po) => (
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

              <div className="space-y-3 border border-slate-200 p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-900 text-sm">تفاصيل الاستلام حسب بنود أمر الشراء</h4>
                  <span className="text-[11px] text-slate-500">اترك البند بصفر إذا لم يصل في هذه الشحنة</span>
                </div>
                {selectedSourceLines.map((sourceLine, index) => {
                  const key = lineKey(sourceLine, index);
                  const received = Number(receivedQuantities[key] || 0);
                  return (
                    <div key={key} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border-t border-slate-100 pt-3">
                      <div className="md:col-span-2">
                        <span className="text-[10px] text-slate-500 font-bold block">الصنف</span>
                        <span className="text-xs font-bold text-slate-900">{sourceLine.itemName} — {sourceLine.itemCode}</span>
                        <span className="text-[10px] text-slate-500 block">المتبقي: {remainingByLine[key]} وحدة</span>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">الواردة فعلياً</label>
                        <input
                          type="number"
                          min="0"
                          max={remainingByLine[key]}
                          value={receivedQuantities[key] ?? 0}
                          onChange={(e) => setReceivedQuantities({ ...receivedQuantities, [key]: Number(e.target.value) })}
                          className="w-full p-2 bg-transparent text-sm font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">المرفوضة</label>
                        <input
                          type="number"
                          min="0"
                          max={received}
                          value={rejectedQuantities[key] ?? 0}
                          onChange={(e) => setRejectedQuantities({ ...rejectedQuantities, [key]: Number(e.target.value) })}
                          className="w-full p-2 bg-transparent text-sm font-bold text-center"
                        />
                      </div>
                      <div className="text-[11px] text-slate-600 font-bold">المقبول: {inspectionResult === 'failed' ? 0 : Math.max(0, received - Number(rejectedQuantities[key] || 0))}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سبب الرفض/الملاحظات</label>
                  <input type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full p-2.5 bg-transparent text-sm" />
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
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> ربط الاستلام المخزني بالترحيل المالي
                  </span>
                  <p className="text-slate-600">
                  المتبقي القابل للاستلام لكل بنود الأمر: <strong>{remainingQty}</strong> وحدة. يحفظ النظام محضر الفحص ويحدّث الكمية المقبولة فقط، ثم يمرر قيد الاستلام (مدين مخزون / دائن GRNI) إلى دفتر الأستاذ الكانوني.
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
