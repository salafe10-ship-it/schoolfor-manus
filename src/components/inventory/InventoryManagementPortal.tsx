import React, { useState, useEffect } from 'react';
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
import { InventoryRepository } from '../../database/repositories/InventoryRepository';
import { InventoryItem } from '../../types';

interface InventoryManagementPortalProps {
  selectedSchool?: any;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventoryManagementPortal({ selectedSchool, triggerNotification }: InventoryManagementPortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const schoolId = selectedSchool?.id || selectedSchool?.school_id || 'school_1';

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) {
      triggerNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  // Load Inventory items from Repository / Storage
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await InventoryRepository.getAll(schoolId);
      setItems(data);
    } catch (err: any) {
      notify(`خطأ في تحميل الأصناف: ${err.message}`, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [schoolId]);

  const handleAddItem = async (newItem: Partial<InventoryItem>) => {
    try {
      await InventoryRepository.create(schoolId, newItem);
      await loadItems();
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر حفظ الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
    }
  };

  const handleUpdateItem = async (id: string, updated: Partial<InventoryItem>) => {
    try {
      await InventoryRepository.update(schoolId, id, updated);
      await loadItems();
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر تعديل الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await InventoryRepository.delete(schoolId, id);
      await loadItems();
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر حذف الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
    }
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

  const handlePrint = () => {
    window.print();
    notify('تم إرسال جرد أصناف المستودعات إلى الطباعة 🖨️', 'info');
  };

  const handleExportExcel = () => {
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

  const handleExportPdf = () => {
    window.print();
    notify('تم تجهيز وإرسال تقرير جرد المستودعات للطباعة / PDF 📄', 'success');
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
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryBrandUnitManager triggerNotification={triggerNotification} />
          )}

          {activeTab === 'suppliers' && (
            <SupplierManager triggerNotification={triggerNotification} />
          )}

          {activeTab === 'warehouses' && (
            <WarehouseManagement triggerNotification={triggerNotification} />
          )}

          {activeTab === 'movements' && (
            <StockMovementManager items={items} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'stocktakes' && (
            <StockCountManager items={items} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'reports' && (
            <InventoryReports items={items} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'audit' && (
            <EnterpriseInventoryQualityAudit />
          )}

          {activeTab === 'settings' && (
            <InventorySettings triggerNotification={triggerNotification} />
          )}
        </main>
      </div>
    </div>
  );
}
