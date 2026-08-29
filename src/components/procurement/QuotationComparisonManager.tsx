import React, { useState } from 'react';
import { 
  ArrowRightLeft, FileSpreadsheet, CheckCircle2, Award, 
  Clock, Plus, ShieldCheck, DollarSign, Star, FileCheck 
} from 'lucide-react';
import { RequestForQuotation, VendorQuotation, PurchaseRequest, InventorySupplier } from '../../types';

interface QuotationComparisonManagerProps {
  requests: PurchaseRequest[];
  rfqs: RequestForQuotation[];
  quotations: VendorQuotation[];
  suppliers: InventorySupplier[];
  onSaveRfq: (rfq: RequestForQuotation) => Promise<void>;
  onSaveQuotation: (quotation: VendorQuotation, rfq: RequestForQuotation) => Promise<void>;
  onAwardVendor: (rfqId: string, vendorId: string, totalAmount: number) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function QuotationComparisonManager({
  requests,
  rfqs,
  quotations,
  suppliers,
  onSaveRfq,
  onSaveQuotation,
  onAwardVendor,
  triggerNotification
}: QuotationComparisonManagerProps) {
  const [activeRfqId, setActiveRfqId] = useState<string>('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteNo, setQuoteNo] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [unitPrices, setUnitPrices] = useState<Record<string, number>>({});

  const handleAward = async (vq: VendorQuotation) => {
    try {
      await onAwardVendor(vq.rfqId, vq.vendorId, vq.grandTotal);
      triggerNotification?.(`✓ تم ترسية العرض على المورد (${vq.vendorName}) وحفظ أمر الشراء مركزياً`, 'success');
    } catch (error: any) { triggerNotification?.(error?.message || 'تعذرت ترسية العرض', 'danger'); }
  };

  const selectedRfq = rfqs.find(r => r.id === activeRfqId);
  const rfqQuotes = quotations.filter(q => q.rfqId === activeRfqId);

  const handleCreateRfq = async () => {
    const request = requests.find(item => item.status === 'approved');
    if (!request) { triggerNotification?.('يلزم طلب شراء معتمد قبل إنشاء RFQ.', 'warning'); return; }
    const rfq: RequestForQuotation = {
      id: `rfq_${Date.now()}`, schoolId: '', rfqNo: `RFQ-${Date.now()}`, purchaseRequestId: request.id,
      title: request.purpose, issueDate: new Date().toISOString().split('T')[0],
      deadlineDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], vendorIds: [],
      items: request.lines, status: 'draft', createdAt: new Date().toISOString()
    };
    try { await onSaveRfq(rfq); setActiveRfqId(rfq.id); triggerNotification?.(`تم حفظ طلب العروض ${rfq.rfqNo} مركزياً.`, 'success'); }
    catch (error: any) { triggerNotification?.(error?.message || 'تعذر حفظ طلب العروض', 'danger'); }
  };

  const handleSaveQuotation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRfq) return;
    const supplier = suppliers.find(item => item.id === vendorId);
    if (!supplier || !quoteNo.trim() || !Number.isInteger(deliveryDays) || deliveryDays <= 0 || !paymentTerms.trim()
      || selectedRfq.items.some(item => !Number.isFinite(unitPrices[item.id]) || unitPrices[item.id] <= 0)) {
      triggerNotification?.('أكمل المورد ورقم العرض وشروطه وأسعار جميع البنود بقيم صحيحة.', 'warning');
      return;
    }
    const lines = selectedRfq.items.map(item => ({
      itemId: item.itemId || item.itemCode,
      itemName: item.itemName,
      quantity: item.quantityRequested,
      unitPrice: unitPrices[item.id],
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: item.quantityRequested * unitPrices[item.id],
    }));
    const quotation: VendorQuotation = {
      id: `quotation_${Date.now()}`,
      rfqId: selectedRfq.id,
      vendorId: supplier.id,
      vendorName: supplier.name,
      quotationNo: quoteNo.trim(),
      quotationDate: new Date().toISOString().slice(0, 10),
      validUntil: selectedRfq.deadlineDate,
      deliveryDays,
      paymentTerms: paymentTerms.trim(),
      lines,
      grandTotal: lines.reduce((sum, line) => sum + line.totalAmount, 0),
      status: 'received',
    };
    try {
      await onSaveQuotation(quotation, { ...selectedRfq, vendorIds: Array.from(new Set([...selectedRfq.vendorIds, supplier.id])), status: 'sent' });
      setShowQuoteForm(false);
      setQuoteNo(''); setVendorId(''); setDeliveryDays(0); setPaymentTerms(''); setUnitPrices({});
      triggerNotification?.(`تم حفظ عرض المورد ${supplier.name} مركزياً.`, 'success');
    } catch (error: any) { triggerNotification?.(error?.message || 'تعذر حفظ عرض المورد', 'danger'); }
  };

  return (
    <div className="space-y-6" id="quotation-comparison-manager">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-amber-600" /> طلبات عروض الأسعار ومقارنة عروض الموردين (RFQ Matrix)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">تحليل مقارنة الأسعار والجودة وشروط التسليم والترسية المباشرة مع إصدار أمر الشراء</p>
        </div>

        <button 
          onClick={handleCreateRfq}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> إنشاء طلب عروض أسعار جديد (RFQ)
        </button>
      </div>

      {rfqs.length > 0 && (
        <div className="p-3 flex flex-wrap gap-2">
          {rfqs.map(rfq => <button key={rfq.id} onClick={() => setActiveRfqId(rfq.id)} className="px-3 py-2 bg-slate-100 text-slate-800 font-bold text-xs">{rfq.rfqNo} — {rfq.status}</button>)}
        </div>
      )}

      {/* Comparison Matrix View */}
      {selectedRfq && (
        <div className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-mono text-xs font-bold rounded-lg border border-amber-200">
                {selectedRfq.rfqNo}
              </span>
              <h4 className="text-lg font-black text-slate-900 mt-1">{selectedRfq.title}</h4>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold">الموعد النهائي: <strong className="text-slate-900">{selectedRfq.deadlineDate}</strong></span>
              <button onClick={() => setShowQuoteForm(true)} className="px-3 py-2 bg-amber-700 text-white text-xs font-bold">تسجيل عرض مورد</button>
            </div>
          </div>

          {/* Side-By-Side Vendor Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rfqQuotes.map((vq) => (
              <div 
                key={vq.id} 
                className={`p-5 border-2 transition relative flex flex-col justify-between ${
                  vq.evaluationScore && vq.evaluationScore >= 90 
                    ? 'border-amber-500 bg-amber-50/20' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                {vq.evaluationScore && vq.evaluationScore >= 90 && (
                  <span className="absolute -top-3 right-4 px-3 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> العرض الأعلى تقييماً ومعيارية
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h5 className="font-black text-slate-900 text-base">{vq.vendorName}</h5>
                      <span className="text-xs text-slate-500 font-mono">رقم العرض: {vq.quotationNo}</span>
                    </div>

                    <div className="text-left">
                      <span className="text-xl font-black text-emerald-700 block">{vq.grandTotal.toLocaleString('ar-SA')} د.ل</span>
                      <span className="text-[10px] text-slate-400 font-bold">شامل الضريبة والتركيب</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-transparent rounded-lg">
                      <span className="text-slate-600 font-bold">مدة التسليم والتركيب:</span>
                      <strong className="text-slate-900">{vq.deliveryDays} أيام عمل</strong>
                    </div>

                    <div className="flex justify-between p-2 bg-transparent rounded-lg">
                      <span className="text-slate-600 font-bold">شروط السداد المالي:</span>
                      <strong className="text-slate-900">{vq.paymentTerms}</strong>
                    </div>

                    <div className="flex justify-between p-2 bg-transparent rounded-lg">
                      <span className="text-slate-600 font-bold">درجة التقييم الفني:</span>
                      <strong className="text-amber-700 font-black">{vq.evaluationScore} / 100</strong>
                    </div>
                  </div>

                  {/* Items detail */}
                  <div className="border-t border-slate-100 pt-3 space-y-1">
                    <h6 className="font-bold text-slate-900 text-xs">الأصناف والتسعير:</h6>
                    {vq.lines.map((l, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-700 font-medium">
                        <span>{l.itemName} ({l.quantity} قطع)</span>
                        <strong className="font-bold">{l.totalAmount.toLocaleString('ar-SA')} د.ل</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => handleAward(vq)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Award className="w-4 h-4 text-amber-400" /> اعتماد وترسية أمر الشراء PO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showQuoteForm && selectedRfq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveQuotation} className="bg-white p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4" dir="rtl">
            <h3 className="font-black text-lg">تسجيل عرض مورد موثق — {selectedRfq.rfqNo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select required value={vendorId} onChange={e => setVendorId(e.target.value)} className="p-2.5"><option value="">اختر المورد</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input required value={quoteNo} onChange={e => setQuoteNo(e.target.value)} placeholder="رقم عرض المورد" className="p-2.5" />
              <input required type="number" min="1" value={deliveryDays || ''} onChange={e => setDeliveryDays(Number(e.target.value))} placeholder="مدة التسليم بالأيام" className="p-2.5" />
              <input required value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="شروط الدفع" className="p-2.5" />
            </div>
            <div className="space-y-2">
              {selectedRfq.items.map(item => <label key={item.id} className="grid grid-cols-3 gap-3 items-center text-sm"><span className="col-span-2 font-bold">{item.itemName} × {item.quantityRequested}</span><input required type="number" min="0.01" step="0.01" value={unitPrices[item.id] || ''} onChange={e => setUnitPrices(prev => ({ ...prev, [item.id]: Number(e.target.value) }))} placeholder="سعر الوحدة" className="p-2" /></label>)}
            </div>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowQuoteForm(false)} className="px-4 py-2 bg-slate-100">إلغاء</button><button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold">حفظ العرض مركزياً</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
