import React, { useState } from 'react';
import { 
  ArrowRightLeft, FileSpreadsheet, CheckCircle2, Award, 
  Clock, Plus, ShieldCheck, DollarSign, Star, FileCheck 
} from 'lucide-react';
import { RequestForQuotation, VendorQuotation, PurchaseRequest } from '../../types';

interface QuotationComparisonManagerProps {
  requests: PurchaseRequest[];
  onAwardVendor: (rfqId: string, vendorId: string, totalAmount: number) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function QuotationComparisonManager({
  requests,
  onAwardVendor,
  triggerNotification
}: QuotationComparisonManagerProps) {
  const [activeRfqId, setActiveRfqId] = useState<string>('rfq_1');

  // Sample RFQ and Vendor Quotation state
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>([
    {
      id: 'rfq_1',
      schoolId: 'school_1',
      rfqNo: 'RFQ-2026-009',
      title: 'طلب عروض أسعار لتجهيز معامل الحاسب والذكاء الاصطناعي',
      issueDate: '2026-08-01',
      deadlineDate: '2026-08-10',
      vendorIds: ['sup_sony', 'sup_lg', 'sup_dell'],
      status: 'responses_received',
      items: [
        {
          id: 'i1',
          itemCode: 'SKU-E-001',
          itemName: 'أجهزة بروجكتور فائقة الجودة سوني UHD',
          unit: 'جهاز',
          quantityRequested: 10,
          estimatedUnitPrice: 3000,
          totalAmount: 30000
        }
      ],
      createdAt: '2026-08-01'
    }
  ]);

  const [quotations, setQuotations] = useState<VendorQuotation[]>([
    {
      id: 'vq_1',
      rfqId: 'rfq_1',
      vendorId: 'sup_sony',
      vendorName: 'شركة سوني العالمية - التوريدات التعليمية',
      quotationNo: 'QUO-SONY-771',
      quotationDate: '2026-08-02',
      validUntil: '2026-09-01',
      deliveryDays: 7,
      paymentTerms: 'الدفع بعد 30 يوماً من الاستلام المعتمد',
      evaluationScore: 95,
      lines: [
        {
          itemId: 'SKU-E-001',
          itemName: 'أجهزة بروجكتور سوني 4K UHD',
          quantity: 10,
          unitPrice: 3000,
          discountAmount: 0,
          taxAmount: 4500,
          totalAmount: 34500
        }
      ],
      grandTotal: 34500,
      status: 'under_review'
    },
    {
      id: 'vq_2',
      rfqId: 'rfq_1',
      vendorId: 'sup_lg',
      vendorName: 'مؤسسة LG للتكنولوجيا والحلول المدرسية',
      quotationNo: 'QUO-LG-992',
      quotationDate: '2026-08-02',
      validUntil: '2026-08-25',
      deliveryDays: 14,
      paymentTerms: '50% دفعة مقدمة و 50% عند التسليم',
      evaluationScore: 82,
      lines: [
        {
          itemId: 'SKU-E-001',
          itemName: 'أجهزة عرض شاشات LG ProJet',
          quantity: 10,
          unitPrice: 2800,
          discountAmount: 1000,
          taxAmount: 4050,
          totalAmount: 31050
        }
      ],
      grandTotal: 31050,
      status: 'under_review'
    }
  ]);

  const handleAward = (vq: VendorQuotation) => {
    onAwardVendor(vq.rfqId, vq.vendorId, vq.grandTotal);
    if (triggerNotification) {
      triggerNotification(`✓ تم ترسية المناقصة على المورد (${vq.vendorName}) بقيمة ${vq.grandTotal.toLocaleString('ar-SA')} د.ل وإصدار أمر الشراء تلقائياً`, 'success');
    }
  };

  const selectedRfq = rfqs.find(r => r.id === activeRfqId);
  const rfqQuotes = quotations.filter(q => q.rfqId === activeRfqId);

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
          onClick={() => alert('يمكنك اختيار طلب شراء معتمد وتحويله إلى طلب عروض أسعار RFQ')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> إنشاء طلب عروض أسعار جديد (RFQ)
        </button>
      </div>

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

            <span className="text-xs text-slate-500 font-bold">
              الموعد النهائي للتقديم: <strong className="text-slate-900">{selectedRfq.deadlineDate}</strong>
            </span>
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
    </div>
  );
}
