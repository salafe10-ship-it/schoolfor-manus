import React, { useState } from 'react';
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
import { PurchaseRequest, PurchaseOrder, GoodsReceiptNote, VendorBill } from '../../types';
import type { InventoryCanonicalDatabase } from '../inventory/inventoryCanonical';
import { getTrustedAccessToken } from '../../utils/auth';

interface ProcurementManagementPortalProps {
  selectedSchool?: any;
  setActiveSection?: (section: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
  database: InventoryCanonicalDatabase;
  onCommit: (database: InventoryCanonicalDatabase, successMessage?: string) => Promise<void>;
  canonicalVersion: number;
}

export default function ProcurementManagementPortal({
  selectedSchool,
  setActiveSection,
  triggerNotification,
  database,
  onCommit,
  canonicalVersion
}: ProcurementManagementPortalProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const { purchaseRequests, purchaseOrders, goodsReceipts, vendorBills } = database;
  const commitPatch = async (patch: Partial<InventoryCanonicalDatabase>, message?: string) => onCommit({ ...database, ...patch }, message);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
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
      const next = purchaseOrders.some(item => item.id === po.id) ? purchaseOrders.map(item => item.id === po.id ? po : item) : [po, ...purchaseOrders];
      await commitPatch({ purchaseOrders: next });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ أمر الشراء.', 'warning');
      throw error;
    }
  };

  const handleSaveReceipt = async (grn: GoodsReceiptNote) => {
    try {
      const nextReceipts = goodsReceipts.some(item => item.id === grn.id) ? goodsReceipts.map(item => item.id === grn.id ? grn : item) : [grn, ...goodsReceipts];
      const nextOrders = purchaseOrders.map(po => po.id === grn.purchaseOrderId ? { ...po, status: 'partially_received' as const } : po);
      const acceptedByItem = new Map<string, number>();
      for (const line of grn.lines) acceptedByItem.set(line.itemId, (acceptedByItem.get(line.itemId) || 0) + Number(line.acceptedQty || 0));
      const nextItems = database.items.map(item => acceptedByItem.has(item.id) ? { ...item, quantity: item.quantity + (acceptedByItem.get(item.id) || 0) } : item);
      await commitPatch({ goodsReceipts: nextReceipts, purchaseOrders: nextOrders, items: nextItems });
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ محضر الاستلام.', 'warning');
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

  const handleConvertToOrder = async (pr: PurchaseRequest) => {
    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      schoolId: pr.schoolId || '',
      poNo: `PO-${Date.now()}`,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      purchaseRequestId: pr.id,
      vendorId: '',
      vendorName: '',
      warehouseId: '',
      paymentTerms: '',
      deliveryTerms: '',
      status: 'draft',
      lines: pr.lines.map(l => ({
        ...l,
        quantityOrdered: l.quantityApproved || l.quantityRequested,
        quantityReceived: 0,
        actualUnitPrice: l.estimatedUnitPrice
      })),
      subtotal: pr.totalEstimatedAmount,
      taxAmount: 0,
      discountAmount: 0,
      grandTotal: pr.totalEstimatedAmount,
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
    const quotation = database.quotations.find(item => item.rfqId === rfqId && item.vendorId === vendorId);
    if (!quotation) throw new Error('لا يمكن ترسية عرض غير موجود في المصدر المركزي.');
    const warehouseId = database.warehouses[0]?.id;
    if (!warehouseId) throw new Error('يلزم مستودع مركزي معتمد قبل إنشاء أمر الشراء.');
    const newPO: PurchaseOrder = {
      id: `po_rfq_${Date.now()}`,
      schoolId: '',
      poNo: `PO-RFQ-${Date.now()}`,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      vendorId,
      vendorName: supplier.name,
      warehouseId,
      paymentTerms: quotation.paymentTerms,
      deliveryTerms: `التسليم خلال ${quotation.deliveryDays} يوم`,
      status: 'pending_approval',
      lines: quotation.lines.map((line, index) => ({
        id: `pol_${Date.now()}_${index}`, itemId: line.itemId, itemCode: line.itemId, itemName: line.itemName,
        unit: 'وحدة', quantityRequested: line.quantity, quantityOrdered: line.quantity, quantityReceived: 0,
        estimatedUnitPrice: line.unitPrice, actualUnitPrice: line.unitPrice, taxAmount: line.taxAmount, totalAmount: line.totalAmount
      })),
      subtotal: quotation.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice - line.discountAmount, 0),
      taxAmount: quotation.lines.reduce((sum, line) => sum + line.taxAmount, 0),
      discountAmount: 0,
      grandTotal: totalAmount,
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
        onRefresh={() => {
          notify('البيانات المعروضة متزامنة مع snapshot المركزي الحالي.', 'info');
        }}
        onPrint={async () => { try { await auditReport('print'); window.print(); } catch (error: any) { notify(error?.message || 'تعذر طباعة التقرير.', 'danger'); } }}
        onExportExcel={async () => {
          try { await auditReport('csv'); } catch (error: any) { notify(error?.message || 'تعذر تصدير التقرير.', 'danger'); return; }
          const csv = "data:text/csv;charset=utf-8,\uFEFF" +
            "رقم الفاتورة,المورد,الإجمالي,المدفوع,المتبقي,الحالة\n" +
            vendorBills.map(bill => `${bill.billNo},"${bill.vendorName}",${bill.grandTotal},${bill.paidAmount},${bill.remainingAmount},${bill.status}`).join("\n");
          const link = document.createElement('a');
          link.href = encodeURI(csv);
          link.download = `edupro_procurement_bills_${Date.now()}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          notify('تم تصدير فواتير الموردين إلى ملف CSV بنجاح.', 'success');
        }}
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
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'receipts' && (
          <GoodsReceiptManager 
            receipts={goodsReceipts}
            orders={purchaseOrders}
            onSaveReceipt={handleSaveReceipt}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'bills' && (
          <VendorBillPaymentManager 
            vendorBills={vendorBills}
            receipts={goodsReceipts}
            orders={purchaseOrders}
            onSaveBill={handleSaveBill}
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
          />
        )}

        {activeTab === 'settings' && (
          <ProcurementSettings settings={database.procurementSettings} onSave={async procurementSettings => commitPatch({ procurementSettings })} triggerNotification={triggerNotification} />
        )}
      </div>
    </div>
  );
}
