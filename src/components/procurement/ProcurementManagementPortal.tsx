import React, { useState, useEffect } from 'react';
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
import { ProcurementRepository } from '../../database/repositories/ProcurementRepository';
import { FallbackStorage } from '../../database/repositories/FallbackStorage';
import { PurchaseRequest, PurchaseOrder, GoodsReceiptNote, VendorBill, VendorPayment } from '../../types';

interface ProcurementManagementPortalProps {
  selectedSchool?: any;
  setActiveSection?: (section: string) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function ProcurementManagementPortal({
  selectedSchool,
  setActiveSection,
  triggerNotification
}: ProcurementManagementPortalProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);

  // Load state from ProcurementRepository on mount
  useEffect(() => {
    try {
      setPurchaseRequests(ProcurementRepository.getPurchaseRequests());
      setPurchaseOrders(ProcurementRepository.getPurchaseOrders());
      setGoodsReceipts(ProcurementRepository.getGoodsReceipts());
      setVendorBills(ProcurementRepository.getVendorBills());
    } catch (error) {
      // Canonical mode intentionally blocks local procurement storage. Keep the
      // portal usable and communicate the blocked state instead of crashing it.
      setPurchaseRequests([]);
      setPurchaseOrders([]);
      setGoodsReceipts([]);
      setVendorBills([]);
      triggerNotification?.('المشتريات متوقفة حتى يتوفر مصدر مركزي موثوق.', 'warning');
      console.error('Procurement source unavailable:', error);
    }
  }, [triggerNotification]);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  // Handlers for persistence updates
  const handleSaveRequest = (pr: PurchaseRequest) => {
    try {
      ProcurementRepository.savePurchaseRequest(pr);
      setPurchaseRequests(ProcurementRepository.getPurchaseRequests());
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ طلب الشراء.', 'warning');
    }
  };

  const handleDeleteRequest = (id: string) => {
    try {
      ProcurementRepository.deletePurchaseRequest(id);
      setPurchaseRequests(ProcurementRepository.getPurchaseRequests());
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حذف طلب الشراء.', 'warning');
    }
  };

  const handleSaveOrder = (po: PurchaseOrder) => {
    try {
      ProcurementRepository.savePurchaseOrder(po);
      setPurchaseOrders(ProcurementRepository.getPurchaseOrders());
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ أمر الشراء.', 'warning');
    }
  };

  const handleSaveReceipt = (grn: GoodsReceiptNote) => {
    try {
      ProcurementRepository.saveGoodsReceipt(grn);
      setGoodsReceipts(ProcurementRepository.getGoodsReceipts());
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ محضر الاستلام.', 'warning');
      return;
    }

    // Automatically update the associated Purchase Order status
    const poIndex = purchaseOrders.findIndex(p => p.id === grn.purchaseOrderId);
    if (poIndex >= 0) {
      const po = purchaseOrders[poIndex];
      const updatedPO: PurchaseOrder = {
        ...po,
        status: 'partially_received'
      };
      ProcurementRepository.savePurchaseOrder(updatedPO);
      setPurchaseOrders(ProcurementRepository.getPurchaseOrders());
    }
  };

  const handleSaveBill = (bill: VendorBill) => {
    try {
      ProcurementRepository.saveVendorBill(bill);
      setVendorBills(ProcurementRepository.getVendorBills());
    } catch (error: any) {
      notify(error?.message || 'المشتريات متوقفة؛ تعذر حفظ فاتورة المورد.', 'warning');
    }
  };

  const handleRecordPayment = (payment: VendorPayment) => {
    try {
      ProcurementRepository.saveVendorPayment(payment);
      notify(`تم حفظ دفعة المورد ${payment.paymentNo} وتسجيل مرجعها في سجل المدفوعات.`, 'success');
    } catch (error: any) {
      notify(error?.message || 'تسجيل دفعة المورد متوقف حتى يتوفر مصدر مشتريات مركزي موثوق؛ لم يُنشأ قيد.', 'warning');
    }
  };

  const handleConvertToOrder = (pr: PurchaseRequest) => {
    if (FallbackStorage.isCanonicalPersistenceRequired()) {
      notify('تحويل طلب الشراء متوقف حتى يتوفر مصدر مشتريات مركزي موثوق.', 'warning');
      return;
    }
    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      schoolId: pr.schoolId || 'school_1',
      poNo: `PO-${Date.now()}`,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      purchaseRequestId: pr.id,
      vendorId: '',
      vendorName: '',
      warehouseId: 'branch_1_1',
      paymentTerms: '30 يوماً من الاستلام المعتمد',
      deliveryTerms: 'تسليم أرض المستودع الرئيسي',
      status: 'pending_approval',
      lines: pr.lines.map(l => ({
        ...l,
        quantityOrdered: l.quantityApproved || l.quantityRequested,
        quantityReceived: 0,
        actualUnitPrice: l.estimatedUnitPrice
      })),
      subtotal: pr.totalEstimatedAmount,
      taxAmount: pr.totalEstimatedAmount * 0.15,
      discountAmount: 0,
      grandTotal: pr.totalEstimatedAmount * 1.15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ProcurementRepository.savePurchaseOrder(newPO);
    setPurchaseOrders(ProcurementRepository.getPurchaseOrders());

    // Update PR status to converted_to_po
    const updatedPR: PurchaseRequest = { ...pr, status: 'converted_to_po' };
    ProcurementRepository.savePurchaseRequest(updatedPR);
    setPurchaseRequests(ProcurementRepository.getPurchaseRequests());

    notify(`✓ تم تحويل طلب الشراء رقم (${pr.requestNo}) إلى أمر شراء معلّق للمراجعة رقم (${newPO.poNo})`, 'success');
    setActiveTab('orders');
  };

  const handleAwardVendor = (rfqId: string, vendorId: string, totalAmount: number) => {
    if (FallbackStorage.isCanonicalPersistenceRequired()) {
      notify('ترسية العرض متوقفة حتى يتوفر مصدر مشتريات مركزي موثوق.', 'warning');
      return;
    }
    const newPO: PurchaseOrder = {
      id: `po_rfq_${Date.now()}`,
      schoolId: 'school_1',
      poNo: `PO-RFQ-${Date.now()}`,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      vendorId,
      vendorName: vendorId === 'sup_sony' ? 'شركة سوني العالمية' : 'مؤسسة LG للتكنولوجيا',
      warehouseId: 'branch_1_1',
      paymentTerms: 'الدفع بعد 30 يوماً من الفحص المعتمد',
      deliveryTerms: 'شامل التركيب والضمان',
      status: 'pending_approval',
      lines: [
        {
          id: `pol_${Date.now()}`,
          itemCode: 'SKU-E-001',
          itemName: 'أجهزة بروجكتور سوني UHD',
          unit: 'جهاز',
          quantityRequested: 10,
          quantityOrdered: 10,
          quantityReceived: 0,
          estimatedUnitPrice: 3000,
          actualUnitPrice: 3000,
          totalAmount
        }
      ],
      subtotal: totalAmount / 1.15,
      taxAmount: totalAmount - (totalAmount / 1.15),
      discountAmount: 0,
      grandTotal: totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ProcurementRepository.savePurchaseOrder(newPO);
    setPurchaseOrders(ProcurementRepository.getPurchaseOrders());
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
          setPurchaseRequests(ProcurementRepository.getPurchaseRequests());
          setPurchaseOrders(ProcurementRepository.getPurchaseOrders());
          setGoodsReceipts(ProcurementRepository.getGoodsReceipts());
          setVendorBills(ProcurementRepository.getVendorBills());
          notify('تم تحديث بيانات وحدة المشتريات بنجاح', 'success');
        }}
        onPrint={() => window.print()}
        onExportExcel={() => {
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
            onSaveBill={handleSaveBill}
            onRecordPayment={handleRecordPayment}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierManager />
        )}

        {activeTab === 'reports' && (
          <ProcurementReports 
            orders={purchaseOrders}
            receipts={goodsReceipts}
            vendorBills={vendorBills}
          />
        )}

        {activeTab === 'settings' && (
          <ProcurementSettings triggerNotification={triggerNotification} />
        )}
      </div>
    </div>
  );
}
