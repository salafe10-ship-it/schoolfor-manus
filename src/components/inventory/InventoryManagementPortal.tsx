import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, Barcode, ClipboardCheck, FileSpreadsheet, 
  FileText, LayoutDashboard, Package, Ruler, Settings, 
  ShieldCheck, Tag, Tags, Truck, Warehouse 
} from 'lucide-react';
import EnterpriseActionToolbar from '../shared/EnterpriseActionToolbar';
import InventoryDashboard from './InventoryDashboard';
import InventoryItemList from './InventoryItemList';
import WarehouseManagement from './WarehouseManagement';
import StockMovementManager from './StockMovementManager';
import StockCountManager from './StockCountManager';
import CategoryBrandUnitManager from './CategoryBrandUnitManager';
import SupplierManager from './SupplierManager';
import InventoryReports from './InventoryReports';
import InventorySettings from './InventorySettings';
import EnterpriseInventoryQualityAudit from '../../certification/EnterpriseInventoryQualityAudit';
import { InventoryItem } from '../../types';
import ProcurementManagementPortal from '../procurement/ProcurementManagementPortal';
import { getTrustedAccessToken } from '../../utils/auth';
import { emptyInventoryCanonicalDatabase, InventoryCanonicalDatabase, normalizeInventoryCanonicalDatabase } from './inventoryCanonical';

interface InventoryManagementPortalProps {
  selectedSchool?: any;
  initialTab?: string;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventoryManagementPortal({ selectedSchool, initialTab = 'dashboard', triggerNotification }: InventoryManagementPortalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [database, setDatabase] = useState<InventoryCanonicalDatabase>(emptyInventoryCanonicalDatabase);
  const [isLoading, setIsLoading] = useState(false);
  const versionRef = useRef(0);
  const items = database.items;

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) {
      triggerNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  const loadDatabase = async () => {
    try {
      setIsLoading(true);
      const token = getTrustedAccessToken();
      if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
      const response = await fetch('/api/inventory/database', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تحميل المخزون والمشتريات.');
      versionRef.current = Number(payload?.meta?.version || 0);
      setDatabase(normalizeInventoryCanonicalDatabase(payload.data));
    } catch (err: any) {
      notify(`خطأ في تحميل المخزون والمشتريات: ${err.message}`, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDatabase();
  }, [selectedSchool?.id, selectedSchool?.school_id]);

  const commitDatabase = async (nextDatabase: InventoryCanonicalDatabase, successMessage?: string) => {
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    const response = await fetch('/api/inventory/database', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedVersion: versionRef.current, data: nextDatabase })
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ المخزون والمشتريات.');
    versionRef.current = Number(payload?.meta?.version || versionRef.current + 1);
    setDatabase(normalizeInventoryCanonicalDatabase(payload.data || nextDatabase));
    if (successMessage) notify(successMessage, 'success');
  };

  const updateCollection = async <K extends keyof InventoryCanonicalDatabase,>(key: K, value: InventoryCanonicalDatabase[K], successMessage?: string) => {
    await commitDatabase({ ...database, [key]: value }, successMessage);
  };

  const handleAddItem = async (newItem: Partial<InventoryItem>) => {
    try {
      const item = { ...newItem, id: newItem.id || `inv_item_${Date.now()}` } as InventoryItem;
      await updateCollection('items', [...items, item]);
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر حفظ الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
      throw err;
    }
  };

  const handleUpdateItem = async (id: string, updated: Partial<InventoryItem>) => {
    try {
      await updateCollection('items', items.map(item => item.id === id ? { ...item, ...updated, id } as InventoryItem : item));
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر تعديل الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
      throw err;
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await updateCollection('items', items.filter(item => item.id !== id));
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر حذف الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
      throw err;
    }
  };

  const handleApproveMovement = async (movement: any) => {
    if (!['pending_approval', 'approved'].includes(String(movement.status))) throw new Error('الحركة ليست في حالة اعتماد أو إعادة ترحيل.');
    const item = database.items.find(row => row.id === movement.itemId);
    if (!item) throw new Error('الصنف المرتبط بالحركة غير موجود.');
    const quantity = Number(movement.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('كمية الحركة غير صالحة للاعتماد.');
    const isRetry = movement.status === 'approved';
    const nextQuantity = !isRetry && movement.type === 'purchase' ? item.quantity + quantity : !isRetry && movement.type === 'sale' ? item.quantity - quantity : item.quantity;
    if (!isRetry && nextQuantity < 0 && !database.settings.allowNegativeStock) {
      throw new Error(`لا يمكن اعتماد الصرف؛ رصيد ${item.name} غير كافٍ.`);
    }
    const approvedMovement = isRetry ? movement : { ...movement, status: 'approved', statusLabel: movement.type === 'transfer' ? 'معتمد — تحويل داخلي' : 'معتمد — جارٍ ترحيل القيد', approvedAt: new Date().toISOString() };
    await commitDatabase({
      ...database,
      items: isRetry ? database.items : database.items.map(row => row.id === item.id ? { ...row, quantity: nextQuantity } : row),
      movements: database.movements.map(row => row.id === movement.id ? approvedMovement : row)
    });
    notify(`تم اعتماد الحركة ${movement.id} وتحديث رصيد المخزون؛ وسيظهر رقم القيد الكانوني عند نجاح الترحيل.`, 'success');
  };

  const handleApproveStocktake = async (stocktake: any) => {
    if (stocktake.status !== 'pending_approval') throw new Error('محضر الجرد ليس في حالة انتظار الاعتماد.');
    const item = database.items.find(row => row.id === stocktake.itemId);
    if (!item) throw new Error('الصنف المرتبط بمحضر الجرد غير موجود.');
    if (Number(item.quantity) !== Number(stocktake.bookQty)) throw new Error('تغير الرصيد الدفتري بعد إنشاء المحضر؛ أعد المطابقة قبل الاعتماد.');
    const approvedStocktake = {
      ...stocktake,
      status: 'approved',
      statusLabel: Number(stocktake.discrepancy) === 0 ? 'معتمد — لا أثر مالي' : 'معتمد — جارٍ ترحيل التسوية',
      approvedAt: new Date().toISOString()
    };
    await commitDatabase({
      ...database,
      items: database.items.map(row => row.id === item.id ? { ...row, quantity: Number(stocktake.actualQty) } : row),
      stocktakes: database.stocktakes.map(row => row.id === stocktake.id ? approvedStocktake : row)
    });
    notify(`تم اعتماد محضر الجرد ${stocktake.id} وتحديث رصيد الصنف؛ وسيظهر رقم قيد التسوية الكانوني عند نجاح الترحيل.`, 'success');
  };

  const handleNew = () => {
    setActiveTab('items');
    notify('تم الانتقال لنموذج إضافة صنف جديد لدليل الأصناف 📦', 'info');
  };

  const handleSave = () => {
    notify('الحفظ يتم من نموذج الصنف بعد إدخال بياناته؛ لم يتم تسجيل تغيير من زر الحفظ العام.', 'warning');
  };

  const handleSearch = () => {
    setActiveTab('items');
    notify('جاري تطبيق تصفية البحث في قائمة الأصناف 🔍', 'info');
  };

  const auditReport = async (format: 'csv' | 'print') => {
    const token = getTrustedAccessToken();
    if (!token) throw new Error('انتهت جلسة الدخول الموثوقة.');
    const response = await fetch('/api/inventory/reports/audit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType: 'valuation', format, expectedVersion: versionRef.current })
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تدقيق تقرير المخزون.');
  };

  const handlePrint = async () => {
    try {
      await auditReport('print');
      window.print();
      notify('تم تدقيق جرد أصناف المستودعات وإرساله إلى الطباعة 🖨️', 'info');
    } catch (error: any) {
      notify(error?.message || 'تعذر تدقيق تقرير المخزون قبل الطباعة.', 'danger');
    }
  };

  const handleExportExcel = async () => {
    try { await auditReport('csv'); } catch (error: any) {
      notify(error?.message || 'تعذر تدقيق تقرير المخزون قبل التصدير.', 'danger');
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      "كود الصنف,اسم الصنف,الفئة,سعر التكلفة,سعر البيع,الكمية الحالية,المستودع\n" +
      items.map(i => `${i.sku || i.id},${i.name},${i.categoryId},${i.costPrice},${i.salePrice},${i.quantity},${i.warehouseId}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edupro_inventory_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('تم تصدير كشف حركة الأصناف لملف CSV بنجاح 📊', 'success');
  };

  const handleExportPdf = async () => {
    try {
      await auditReport('print');
      window.print();
      notify('تم تدقيق وتجهيز تقرير جرد المستودعات للطباعة / PDF 📄', 'success');
    } catch (error: any) {
      notify(error?.message || 'تعذر تدقيق تقرير المخزون قبل تجهيز PDF.', 'danger');
    }
  };

  const handleImportExcel = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .json, .xlsx';
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        notify(`تم اختيار الملف "${file.name}"، لكن الاستيراد لم يُنفذ لأن مسار الاستيراد المركزي غير مهيأ بعد.`, 'warning');
      }
    };
    fileInput.click();
  };

  const handleDownloadTemplate = () => {
    const csvTemplate = "data:text/csv;charset=utf-8,\uFEFF" +
      "كود_الصنف,اسم_الصنف,الفئة,سعر_التكلفة,سعر_البيع,الكمية_الحالية,المستودع\n" +
      "ITM-1001,اسم الصنف النموذجي,cat_electronics,10.00,15.00,100,branch_1_1\n";
    const encodedUri = encodeURI(csvTemplate);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "edupro_inventory_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('تم تحميل نموذج استيراد الأصناف المعتمد 📑', 'success');
  };

  const tabs = [
    { id: 'dashboard', name: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'items', name: 'دليل الأصناف', icon: Package },
    { id: 'categories', name: 'الفئات والتصنيفات', icon: Tag },
    { id: 'suppliers', name: 'الموردون والتوريد', icon: Truck },
    { id: 'warehouses', name: 'المستودعات والأرفف', icon: Warehouse },
    { id: 'movements', name: 'الحركات المخزنية', icon: ArrowLeftRight },
    { id: 'stocktakes', name: 'الجرد والتسويات', icon: ClipboardCheck },
    { id: 'procurement', name: 'المشتريات والتوريدات', icon: Truck },
    { id: 'reports', name: 'التقارير والتحليلات', icon: FileSpreadsheet },
    { id: 'audit', name: 'الاعتماد الفني والجودة', icon: ShieldCheck },
    { id: 'settings', name: 'إعدادات المنظومة', icon: Settings },
  ];

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" id="inventory-portal">
      <EnterpriseActionToolbar 
        title="إدارة المخزون والمستودعات المؤسسية (Inventory & Warehouse Control)"
        onNew={handleNew}
        onSave={handleSave}
        onEdit={() => notify('حدد صنفاً من جدول دليل الأصناف للبدء بالتعديل', 'warning')}
        onDelete={() => notify('تم تحديد العنصر للمسح والإحالة إلى الأرشيف', 'warning')}
        onSearch={handleSearch}
        onPrint={handlePrint}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onImportExcel={handleImportExcel}
        onDownloadTemplate={handleDownloadTemplate}
        onRefresh={() => { void loadDatabase(); }}
        isLoading={isLoading}
        onExit={() => setActiveTab('dashboard')}
      />
      
      <div className="flex flex-1 overflow-hidden" id="inventory-content">
        <nav className="w-64 border-l border-slate-200 overflow-y-auto" id="inventory-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-6 py-3.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-[#2a1d13] text-[#fce79a]' 
                  : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50 hover:text-slate-900'
              }`}
              id={`tab-${tab.id}`}
            >
              <tab.icon className="w-5 h-5 ml-3" />
              {tab.name}
            </button>
          ))}
        </nav>
        
        <main className="flex-1 overflow-y-auto p-8" id="inventory-main">
          {activeTab === 'dashboard' && (
            <InventoryDashboard 
              items={items} 
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'items' && (
            <InventoryItemList 
              items={items}
              categories={database.categories}
              units={database.units}
              suppliers={database.suppliers}
              warehouses={database.warehouses}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryBrandUnitManager categories={database.categories} brands={database.brands} units={database.units}
              onSave={async (patch) => commitDatabase({ ...database, ...patch })} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'suppliers' && (
            <SupplierManager suppliers={database.suppliers} onSave={async suppliers => updateCollection('suppliers', suppliers)} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'warehouses' && (
            <WarehouseManagement warehouses={database.warehouses} onSave={async warehouses => updateCollection('warehouses', warehouses)} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'movements' && (
            <StockMovementManager items={items} movements={database.movements} onSave={async movements => updateCollection('movements', movements)} onApproveMovement={handleApproveMovement} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'stocktakes' && (
            <StockCountManager items={items} stocktakes={database.stocktakes} settings={database.settings}
              onSave={async stocktakes => updateCollection('stocktakes', stocktakes)} onApproveStocktake={handleApproveStocktake} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'procurement' && (
            <ProcurementManagementPortal selectedSchool={selectedSchool} triggerNotification={triggerNotification}
              database={database} canonicalVersion={versionRef.current} onCommit={commitDatabase} />
          )}

          {activeTab === 'reports' && (
            <InventoryReports items={items} canonicalVersion={versionRef.current} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'audit' && (
            <EnterpriseInventoryQualityAudit />
          )}

          {activeTab === 'settings' && (
            <InventorySettings settings={database.settings} onSave={async settings => updateCollection('settings', settings)} triggerNotification={triggerNotification} />
          )}
        </main>
      </div>
    </div>
  );
}
