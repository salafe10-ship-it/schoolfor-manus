import React, { useRef, useState } from 'react';
import { 
  ShoppingBag, FileText, ArrowRightLeft, Truck, 
  DollarSign, FileSpreadsheet, Settings, Users, 
  ShieldCheck, BarChart3, ChevronLeft, CheckCircle2 
} from 'lucide-react';
import EnterpriseActionToolbar from '../shared/EnterpriseActionToolbar';
import ProcurementDashboard from './ProcurementDashboard';
import PurchaseRequestManager from './PurchaseRequestManager';
import QuotationComparisonManager from './QuotationComparisonManager';
import PurchaseOrderManager from './PurchaseOrderManager';
import GoodsReceiptManager from './GoodsReceiptManager';
import VendorBillPaymentManager from './VendorBillPaymentManager';
import ProcurementReports from './ProcurementReports';
import ProcurementSettings from './ProcurementSettings';
import SupplierManager from '../inventory/SupplierManager';
import { getItemWarehouseBalances, withUpdatedWarehouseBalances } from '../inventory/inventoryCanonical';
import { PurchaseRequest, PurchaseOrder, GoodsReceiptNote, VendorBill } from '../../types';
import type { InventoryCanonicalDatabase } from '../inventory/inventoryCanonical';
import { getTrustedAccessToken } from '../../utils/auth';
import { canApproveInventoryAmount, type InventoryCapabilities } from '../inventory/inventoryUiPolicy';

interface ProcurementManagementPortalProps {
  selectedSchool?: any;
  setActiveSection?: (section: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
  database: InventoryCanonicalDatabase;
  onCommit: (database: InventoryCanonicalDatabase, successMessage?: string) => Promise<void>;
  canonicalVersion: number;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  capabilities?: InventoryCapabilities;
}

export default function ProcurementManagementPortal({
  selectedSchool,
  setActiveSection,
  triggerNotification,
  database,
  onCommit,
  canonicalVersion,
  onRefresh,
  isLoading = false,
  capabilities = {}
}: ProcurementManagementPortalProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const paymentAttempt = useRef<{ id: string; billId: string; amount: number; method: string; reference: string } | null>(null);
  const paymentBusy = useRef(false);
  const { purchaseRequests, purchaseOrders, goodsReceipts, vendorBills } = database;
  const commitPatch = async (patch: Partial<InventoryCanonicalDatabase>, message?: string) => onCommit({ ...database, ...patch }, message);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const canonicalItemId = (reference?: string) => {
    const normalized = String(reference || '').trim();
    if (!normalized) return '';
    return database.items.find(item => item.id === normalized || item.sku === normalized)?.id || normalized;
  };

  const auditReport = async (format: 'csv' | 'print') => {
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    const response = await fetch('/api/inventory/reports/audit', { method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType: 'procurement', format, expectedVersion: canonicalVersion }) });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تدقيق تقرير المشتريات.');
  };

  // Handlers for persistence updates
  const handleSaveRequest = async (pr: PurchaseRequest) => {
    try {
      if (['approved', 'rejected'].includes(pr.status) && !canApproveInventoryAmount(pr.totalEstimatedAmount, capabilities, database.procurementSettings)) throw new Error('صلاحيات اعتماد الطلب غير متاحة.');
      const next = purchaseRequests.some(item => item.id === pr.id) ? purchaseRequests.map(item => item.id === pr.id ? pr : item) : [pr, ...purchaseRequests];
      await commitPatch({ purchaseRequests: next });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ طلب الشراء.', 'warning');
      throw error;
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await commitPatch({ purchaseRequests: purchaseRequests.filter(item => item.id !== id) });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حذف طلب الشراء.', 'warning');
      throw error;
    }
  };

  const handleSaveOrder = async (po: PurchaseOrder) => {
    try {
      if (po.status === 'approved' && !canApproveInventoryAmount(po.grandTotal, capabilities, database.procurementSettings)) throw new Error('صلاحيات اعتماد أمر الشراء غير متاحة.');
      const next = purchaseOrders.some(item => item.id === po.id) ? purchaseOrders.map(item => item.id === po.id ? po : item) : [po, ...purchaseOrders];
      await commitPatch({ purchaseOrders: next });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ أمر الشراء.', 'warning');
      throw error;
    }
  };

  const handleSaveReceipt = async (grn: GoodsReceiptNote) => {
    try {
      const previousReceipt = goodsReceipts.find(item => item.id === grn.id);
      if (previousReceipt) throw new Error('إذن الاستلام غير قابل للاستبدال بعد حفظه؛ أنشئ محضر تصحيح معتمد عند الحاجة.');
      if (grn.status !== 'pending_approval') throw new Error('يجب حفظ إذن الاستلام قيد الاعتماد قبل تنفيذ الاعتماد المستقل.');
      await commitPatch({ goodsReceipts: [grn, ...goodsReceipts] });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ محضر الاستلام.', 'warning');
      throw error;
    }
  };

  const handleApproveReceipt = async (receipt: GoodsReceiptNote) => {
    if (receipt.status !== 'pending_approval') throw new Error('إذن الاستلام ليس قيد الاعتماد.');
    if (!canApproveInventoryAmount(Number(receipt.totalReceivedValue || 0), capabilities, database.procurementSettings)
      || (Number(receipt.totalReceivedValue || 0) > 0 && !capabilities.financialWrite)) throw new Error('صلاحيات اعتماد الاستلام أو الترحيل المالي غير متاحة.');
    const finalStatus = receipt.inspectionResult === 'failed' ? 'rejected'
      : receipt.inspectionResult === 'conditional_pass' ? 'partially_accepted' : 'inspected_received';
    const approvedReceipt: GoodsReceiptNote = { ...receipt, status: finalStatus };
    const nextReceipts = goodsReceipts.map(item => item.id === receipt.id ? approvedReceipt : item);
    const quantityDeltas = new Map<string, Map<string, number>>();
    const incomingValueByItem = new Map<string, number>();
    for (const line of approvedReceipt.lines) {
      const itemId = canonicalItemId(line.itemId || line.itemCode);
      if (!itemId) throw new Error(`بند الاستلام ${line.lineId} غير مربوط بصنف مركزي.`);
      const byWarehouse = quantityDeltas.get(itemId) || new Map<string, number>();
      byWarehouse.set(approvedReceipt.warehouseId, (byWarehouse.get(approvedReceipt.warehouseId) || 0) + Number(line.acceptedQty || 0));
      quantityDeltas.set(itemId, byWarehouse);
      incomingValueByItem.set(itemId, (incomingValueByItem.get(itemId) || 0) + Number(line.totalCost || 0));
    }
    const nextItems = database.items.map(item => {
      const byWarehouse = quantityDeltas.get(item.id);
      if (!byWarehouse) return item;
      const balances = getItemWarehouseBalances(item);
      for (const [warehouseId, delta] of byWarehouse) balances[warehouseId] = Number(balances[warehouseId] || 0) + delta;
      const updated = withUpdatedWarehouseBalances(item, balances);
      if (Object.values(balances).some(quantity => quantity < 0)) throw new Error(`لا يمكن أن يصبح رصيد الصنف ${item.name} سالباً بعد الاستلام.`);
      const incomingValue = incomingValueByItem.get(item.id) || 0;
      if (incomingValue > 0 && updated.quantity > 0) {
        const previousValue = Number(item.quantity || 0) * Number(item.costPrice || 0);
        updated.costPrice = Number(((previousValue + incomingValue) / updated.quantity).toFixed(4));
      }
      return updated;
    });
    const nextOrders = purchaseOrders.map(order => {
      if (order.id !== approvedReceipt.purchaseOrderId) return order;
      const orderReceipts = nextReceipts.filter(candidate => candidate.purchaseOrderId === order.id
        && ['inspected_received', 'partially_accepted', 'rejected', 'posted_to_gl'].includes(String(candidate.status)));
      const nextLines = order.lines.map(orderLine => {
        const itemId = canonicalItemId(orderLine.itemId || orderLine.itemCode);
        const received = orderReceipts.reduce((sum, candidate) => sum + candidate.lines
          .filter(line => line.purchaseOrderLineId ? line.purchaseOrderLineId === orderLine.id : canonicalItemId(line.itemId || line.itemCode) === itemId)
          .reduce((lineSum, line) => lineSum + Number(line.acceptedQty || 0), 0), 0);
        return { ...orderLine, itemId, quantityReceived: received };
      });
      const ordered = nextLines.reduce((sum, line) => sum + Number(line.quantityOrdered ?? line.quantityRequested ?? 0), 0);
      const accepted = nextLines.reduce((sum, line) => sum + Number(line.quantityReceived || 0), 0);
      const status = accepted >= ordered && ordered > 0 ? 'fully_received' as const : accepted > 0 ? 'partially_received' as const : order.status;
      return { ...order, lines: nextLines, status };
    });
    try {
      await commitPatch({ goodsReceipts: nextReceipts, purchaseOrders: nextOrders, items: nextItems });
      notify(`تم اعتماد إذن الاستلام ${receipt.grnNo} بواسطة مستخدم مستقل؛ وحُدّث الرصيد والترحيل الكانوني.`, 'success');
    } catch (error: any) {
      notify(error?.message || 'تعذر اعتماد إذن الاستلام وترحيله.', 'warning');
      throw error;
    }
  };

  const handleSaveBill = async (bill: VendorBill) => {
    try {
      const next = vendorBills.some(item => item.id === bill.id) ? vendorBills.map(item => item.id === bill.id ? bill : item) : [bill, ...vendorBills];
      await commitPatch({ vendorBills: next });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ فاتورة المورد.', 'warning');
      throw error;
    }
  };

  const handleApproveBill = async (bill: VendorBill) => {
    if (!canApproveInventoryAmount(bill.grandTotal, capabilities, database.procurementSettings) || (bill.grandTotal > 0 && !capabilities.financialWrite)) throw new Error('صلاحيات اعتماد الفاتورة والترحيل غير متاحة.');
    if (bill.status !== 'pending_matching') throw new Error('فاتورة المورد ليست في حالة انتظار المطابقة.');
    const receipt = goodsReceipts.find(item => item.id === bill.grnId);
    const order = receipt ? purchaseOrders.find(item => item.id === receipt.purchaseOrderId) : undefined;
    if (!receipt || !order) throw new Error('تعذر استكمال المطابقة الثلاثية؛ المستند المرتبط غير موجود.');
    if (!['approved', 'issued', 'partially_received', 'fully_received'].includes(String(order.status))) {
      throw new Error('لا يمكن اعتماد الفاتورة قبل اعتماد أمر الشراء.');
    }
    if (!['inspected_received', 'partially_accepted', 'posted_to_gl'].includes(String(receipt.status))) {
      throw new Error('لا يمكن اعتماد الفاتورة قبل وجود استلام مقبول ومفحوص.');
    }
    if (Math.abs(Number(bill.subtotal) - Number(receipt.totalReceivedValue)) > 0.01 || Math.abs(Number(bill.grandTotal) - Number(bill.subtotal + bill.taxAmount)) > 0.01) {
      throw new Error('قيمة الفاتورة لا تطابق قيمة الاستلام بعد المطابقة الثلاثية.');
    }
    await handleSaveBill({
      ...bill,
      status: 'approved',
      notes: `تمت المطابقة الثلاثية مع أمر الشراء ${order.poNo} وإذن الاستلام ${receipt.grnNo}؛ أُحيل القيد إلى دفتر الأستاذ الكانوني.`,
    });
    notify(`تم اعتماد فاتورة المورد ${bill.billNo} وإنشاء قيد الالتزام الكانوني عند توفر مخطط الحسابات.`, 'success');
  };

  const handlePayBill = async (bill: VendorBill, amount: number, paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'treasury_voucher', referenceNo: string) => {
    if (!capabilities.financialWrite) throw new Error('لا تتوفر صلاحية السداد المالي.');
    if (paymentBusy.current) throw new Error('جارٍ تنفيذ عملية السداد.');
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    if (paymentAttempt.current && (paymentAttempt.current.billId !== bill.id || paymentAttempt.current.amount !== amount || paymentAttempt.current.method !== paymentMethod || paymentAttempt.current.reference !== referenceNo)) throw new Error('نتيجة السداد السابق غير محسومة؛ تحقق من المصدر قبل تغيير بيانات العملية.');
    if (!paymentAttempt.current) paymentAttempt.current = { id: crypto.randomUUID(), billId: bill.id, amount, method: paymentMethod, reference: referenceNo };
    const paymentId = paymentAttempt.current.id;
    paymentBusy.current = true;
    try {
    const response = await fetch(`/api/financial/vendor-bills/${encodeURIComponent(bill.id)}/pay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': paymentId
      },
      body: JSON.stringify({ paymentId, amountPaid: amount, paymentMethod, referenceNo })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.data?.journalId) throw new Error(payload?.message || 'تعذر سداد فاتورة المورد مركزياً.');
    paymentAttempt.current = null;
    notify(`تم سداد فاتورة المورد وترحيل القيد ${payload.data.journalId}؛ ستتم إعادة تحميل المصدر المركزي.`, 'success');
    await onRefresh?.();
    } finally { paymentBusy.current = false; }
  };

  const handleConvertToOrder = async (pr: PurchaseRequest) => {
    if (!capabilities.approve) throw new Error('لا تتوفر صلاحية تحويل الطلب المعتمد.');
    const poLines = pr.lines.filter(line => (line.quantityApproved ?? line.quantityRequested) > 0).map(line => {
      const item = database.items.find(candidate => candidate.id === line.itemId || candidate.sku === line.itemCode);
      if (!item) throw new Error(`لا يمكن تحويل الطلب؛ البند ${line.itemCode} غير مربوط بصنف في دليل المخزون.`);
      if (item.status === 'archived') throw new Error('لا يمكن تحويل طلب لصنف مؤرشف.');
      const quantity = line.quantityApproved ?? line.quantityRequested;
      return {
        ...line,
        itemId: item.id,
        itemCode: item.sku,
        itemName: item.name,
        quantityOrdered: quantity,
        quantityReceived: 0,
        actualUnitPrice: line.estimatedUnitPrice,
        totalAmount: quantity * line.estimatedUnitPrice
      };
    });
    if (!poLines.length) throw new Error('لا توجد كميات معتمدة موجبة للتحويل.');
    const newPO: PurchaseOrder = {
      id: `po_pr_${pr.id}`,
      schoolId: pr.schoolId || '',
      poNo: `PO-${pr.requestNo}`,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      purchaseRequestId: pr.id,
      vendorId: '',
      vendorName: '',
      warehouseId: '',
      paymentTerms: '',
      deliveryTerms: '',
      status: 'draft',
      lines: poLines,
      subtotal: poLines.reduce((sum, line) => sum + line.totalAmount, 0),
      taxAmount: 0,
      discountAmount: 0,
      grandTotal: poLines.reduce((sum, line) => sum + line.totalAmount, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPR: PurchaseRequest = { ...pr, status: 'converted_to_po' };
    await commitPatch({ purchaseOrders: [newPO, ...purchaseOrders], purchaseRequests: purchaseRequests.map(item => item.id === pr.id ? updatedPR : item) });
    notify(`✓ تم تحويل طلب الشراء رقم (${pr.requestNo}) إلى مسودة أمر شراء مركزية رقم (${newPO.poNo}) لاستكمال المورد والمستودع`, 'success');
    setActiveTab('orders');
  };

  const handleAwardVendor = async (rfqId: string, vendorId: string, totalAmount: number) => {
    const supplier = database.suppliers.find(item => item.id === vendorId);
    if (!supplier) throw new Error('لا يمكن ترسية العرض على مورد غير مسجل في المصدر المركزي.');
    const rfq = database.rfqs.find(item => item.id === rfqId);
    if (!rfq || rfq.status === 'awarded' || rfq.status === 'closed') throw new Error('طلب العروض مغلق أو تمت ترسيته مسبقاً.');
    const quotation = database.quotations.find(item => item.rfqId === rfqId && item.vendorId === vendorId);
    if (!quotation) throw new Error('لا يمكن ترسية عرض غير موجود في المصدر المركزي.');
    if (quotation.status === 'rejected') throw new Error('لا يمكن ترسية عرض مرفوض.');
    if (!canApproveInventoryAmount(quotation.grandTotal, capabilities, database.procurementSettings)) throw new Error('صلاحيات ترسية العرض غير متاحة.');
    if (Math.abs(Number(quotation.grandTotal) - Number(totalAmount)) > 0.01) throw new Error('تغير إجمالي العرض قبل الترسية؛ أعد تحميل مصفوفة العروض.');
    const warehouseId = database.warehouses[0]?.id;
    if (!warehouseId) throw new Error('يلزم مستودع مركزي معتمد قبل إنشاء أمر الشراء.');
    const poLines = quotation.lines.map((line, index) => {
      const item = database.items.find(candidate => candidate.id === line.itemId || candidate.sku === line.itemId);
      if (!item) throw new Error(`لا يمكن ترسية العرض؛ البند ${line.itemId || index + 1} غير مربوط بدليل المخزون.`);
      if (item.status === 'archived') throw new Error('لا يمكن ترسية عرض لصنف مؤرشف.');
      return {
        id: `pol_${quotation.id}_${index}`, itemId: item.id, itemCode: item.sku, itemName: item.name,
        unit: 'وحدة', quantityRequested: line.quantity, quantityOrdered: line.quantity, quantityReceived: 0,
        estimatedUnitPrice: line.unitPrice, actualUnitPrice: line.unitPrice, discountAmount: line.discountAmount, taxAmount: line.taxAmount,
        totalAmount: line.quantity * line.unitPrice - line.discountAmount
      };
    });
    const newPO: PurchaseOrder = {
      id: `po_rfq_${rfq.id}_${quotation.id}`,
      rfqId: rfq.id,
      quotationId: quotation.id,
      purchaseRequestId: rfq.purchaseRequestId,
      schoolId: '',
      poNo: `PO-${rfq.rfqNo}`,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      vendorId,
      vendorName: supplier.name,
      warehouseId,
      paymentTerms: quotation.paymentTerms,
      deliveryTerms: `التسليم خلال ${quotation.deliveryDays} يوم`,
      status: 'pending_approval',
      lines: poLines,
      subtotal: quotation.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice - line.discountAmount, 0),
      taxAmount: quotation.lines.reduce((sum, line) => sum + line.taxAmount, 0),
      discountAmount: 0,
      grandTotal: quotation.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice - line.discountAmount + line.taxAmount, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await commitPatch({ purchaseOrders: [newPO, ...purchaseOrders], rfqs: database.rfqs.map(rfq => rfq.id === rfqId ? { ...rfq, status: 'awarded' as const, awardedVendorId: vendorId } : rfq) });
    setActiveTab('orders');
  };

  const navTabs = [
    { id: 'dashboard', label: 'لوحة تحكم المشتريات', icon: BarChart3 },
    { id: 'requests', label: 'طلبات الشراء (PR)', icon: FileText, badge: purchaseRequests.filter(r => r.status === 'pending_approval').length },
    { id: 'quotations', label: 'عروض الأسعار (RFQ)', icon: ArrowRightLeft },
    { id: 'orders', label: 'أوامر الشراء (PO)', icon: ShoppingBag, badge: purchaseOrders.length },
    { id: 'receipts', label: 'الفحص والاستلام (GRN)', icon: Truck, badge: goodsReceipts.length },
    { id: 'bills', label: 'الفواتير والمدفوعات', icon: DollarSign },
    { id: 'suppliers', label: 'سجل الموردين', icon: Users },
    { id: 'reports', label: 'التقارير التحليلية', icon: FileSpreadsheet },
    { id: 'settings', label: 'إعدادات الحوكمة', icon: Settings },
  ];

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl" id="procurement-management-portal">
      {/* Enterprise Unified Action Toolbar */}
      <EnterpriseActionToolbar
        title="منظومة المشتريات والتوريدات الحوكمية (Procurement ERP)"
        onRefresh={onRefresh ? () => { void onRefresh().catch(error => notify(error.message, 'danger')); } : undefined}
        isLoading={isLoading}
      />

      {/* Navigation Sub-Header */}
      <div className="p-2 flex flex-wrap gap-1.5">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                isActive 
                  ? 'bg-[#2a1d13] text-[#fce79a] shadow-sm' 
                  : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  isActive ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Render Area */}
      <div className="transition-all duration-200">
        {activeTab === 'dashboard' && (
          <ProcurementDashboard 
            purchaseRequests={purchaseRequests}
            purchaseOrders={purchaseOrders}
            goodsReceipts={goodsReceipts}
            vendorBills={vendorBills}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'requests' && (
          <PurchaseRequestManager 
            requests={purchaseRequests}
            items={database.items}
            capabilities={capabilities} approvalSettings={database.procurementSettings}
            onSaveRequest={handleSaveRequest}
            onDeleteRequest={handleDeleteRequest}
            onConvertToOrder={handleConvertToOrder}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationComparisonManager 
            requests={purchaseRequests}
            rfqs={database.rfqs}
            quotations={database.quotations}
            suppliers={database.suppliers}
            capabilities={capabilities} approvalSettings={database.procurementSettings}
            onSaveRfq={async rfq => commitPatch({ rfqs: [rfq, ...database.rfqs] })}
            onSaveQuotation={async (quotation, rfq) => commitPatch({
              quotations: [quotation, ...database.quotations],
              rfqs: database.rfqs.map(item => item.id === rfq.id ? rfq : item)
            })}
            onAwardVendor={handleAwardVendor}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'orders' && (
          <PurchaseOrderManager 
            orders={purchaseOrders}
            onSaveOrder={handleSaveOrder}
            onReceiveItems={(po) => setActiveTab('receipts')}
            suppliers={database.suppliers}
            warehouses={database.warehouses}
            capabilities={capabilities} approvalSettings={database.procurementSettings}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'receipts' && (
          <GoodsReceiptManager 
            receipts={goodsReceipts}
            orders={purchaseOrders}
            items={database.items}
            onSaveReceipt={handleSaveReceipt}
            onApproveReceipt={handleApproveReceipt}
            capabilities={capabilities}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'bills' && (
          <VendorBillPaymentManager 
            vendorBills={vendorBills}
            receipts={goodsReceipts}
            orders={purchaseOrders}
            onSaveBill={handleSaveBill}
            onApproveBill={handleApproveBill}
            onPayBill={handlePayBill}
            capabilities={capabilities} approvalSettings={database.procurementSettings}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierManager suppliers={database.suppliers} onSave={async suppliers => commitPatch({ suppliers })} triggerNotification={triggerNotification} />
        )}

        {activeTab === 'reports' && (
          <ProcurementReports 
            orders={purchaseOrders}
            receipts={goodsReceipts}
            vendorBills={vendorBills}
            onAuditReport={auditReport}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'settings' && (
          <ProcurementSettings settings={database.procurementSettings} canEdit={capabilities.settings === true} onSave={async procurementSettings => commitPatch({ procurementSettings })} triggerNotification={triggerNotification} />
        )}
      </div>
    </div>
  );
}
