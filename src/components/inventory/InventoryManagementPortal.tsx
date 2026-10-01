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
import { InventoryItem } from '../../types';
import ProcurementManagementPortal from '../procurement/ProcurementManagementPortal';
import { getTrustedAccessToken } from '../../utils/auth';
import { getItemWarehouseBalances, getItemWarehouseQuantity, InventoryCanonicalDatabase, withUpdatedWarehouseBalances } from './inventoryCanonical';
import { useInventorySnapshot } from './useInventorySnapshot';
import InventoryPrintProvider from './InventoryPrintProvider';
import { canApproveInventoryAmount, roundInventoryMoney } from './inventoryUiPolicy';

interface InventoryManagementPortalProps {
  selectedSchool?: any;
  initialTab?: string;
  onExit?: () => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

function parseCsvRows(source: string): string[][] {
  const input = source.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell.length === 0) quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell); cell = '';
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (quoted) throw new Error('ملف CSV يحتوي على حقل نصي غير مغلق بعلامة اقتباس.');
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some(value => value.trim())) rows.push(row);
  }
  if (rows.length < 2) throw new Error('ملف CSV فارغ أو لا يحتوي صفوف أصناف.');
  return rows;
}

function downloadCsv(filename: string, rows: unknown[][]): void {
  const escape = (value: unknown) => {
    const raw = String(value ?? '');
    const safe = typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const content = `\uFEFF${rows.map(row => row.map(escape).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function InventoryManagementPortal({ selectedSchool, initialTab = 'dashboard', triggerNotification, onExit }: InventoryManagementPortalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newItemRequest, setNewItemRequest] = useState(0);
  const [searchRequest, setSearchRequest] = useState(0);
  const snapshot = useInventorySnapshot();
  const { database, version, capabilities, isLoading, isSaving, checkedAt } = snapshot;
  const versionRef = { current: version ?? 0 };
  const [itemStatusFilter, setItemStatusFilter] = useState('ALL');
  const [formEpoch, setFormEpoch] = useState(0);
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
      await snapshot.refresh();
    } catch (err: any) {
      notify(`خطأ في تحميل المخزون والمشتريات: ${err.message}`, 'danger');
      throw err;
    }
  };

  useEffect(() => {
    snapshot.reset();
    setFormEpoch(value => value + 1);
    void loadDatabase().catch(() => undefined);
  }, [selectedSchool?.id, selectedSchool?.school_id]);

  const commitDatabase = async (nextDatabase: InventoryCanonicalDatabase, successMessage?: string) => {
    await snapshot.commit(nextDatabase);
    if (successMessage) notify(successMessage, 'success');
  };

  const updateCollection = async <K extends keyof InventoryCanonicalDatabase,>(key: K, value: InventoryCanonicalDatabase[K], successMessage?: string) => {
    await commitDatabase({ ...database, [key]: value }, successMessage);
  };

  const handleAddItem = async (newItem: Partial<InventoryItem>) => {
    try {
      if (Number(newItem.quantity || 0) !== 0) throw new Error('تبدأ بطاقة الصنف برصيد صفر؛ أدخل الرصيد بإذن استلام أو حركة مخزنية معتمدة.');
      const item = { ...newItem, id: newItem.id || crypto.randomUUID(), quantity: 0,
        warehouseBalances: newItem.warehouseId ? { [newItem.warehouseId]: 0 } : {} } as InventoryItem;
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
      await updateCollection('items', items.map(item => item.id === id ? { ...item, status: 'archived' } : item));
    } catch (err: any) {
      notify(`المخزون متوقف؛ تعذر حذف الصنف: ${err?.message || 'مصدر البيانات غير متاح'}`, 'warning');
      throw err;
    }
  };

  const handleApproveMovement = async (movement: any) => {
    if (!['pending_approval', 'approved'].includes(String(movement.status))) throw new Error('الحركة ليست في حالة اعتماد أو إعادة ترحيل.');
    const item = database.items.find(row => row.id === movement.itemId);
    if (!item) throw new Error('الصنف المرتبط بالحركة غير موجود.');
    if (item.status === 'archived') throw new Error('لا يمكن اعتماد حركة لصنف مؤرشف.');
    const quantity = Number(movement.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('كمية الحركة غير صالحة للاعتماد.');
    const isRetry = movement.status === 'approved';
    const unitCost = ['issue', 'sale', 'adjustment'].includes(movement.type) ? Number(item.costPrice) : Number(movement.unitCost || 0);
    const totalAmount = roundInventoryMoney(quantity * unitCost);
    if (!canApproveInventoryAmount(totalAmount, capabilities, database.procurementSettings)
      || (movement.type !== 'transfer' && totalAmount > 0 && !capabilities.financialWrite)) throw new Error('صلاحيات الاعتماد أو الترحيل المالي غير متاحة لهذه الحركة.');
    const balances = getItemWarehouseBalances(item);
    const transferFrom = String(movement.warehouseFrom || item.warehouseId || '');
    const transferTo = String(movement.warehouseTo || '');
    const affectedWarehouse = movement.type === 'purchase' ? String(movement.warehouseTo || item.warehouseId || '') : transferFrom;
    const nextBalances = { ...balances };
    if (!isRetry && movement.type === 'purchase') {
      if (!affectedWarehouse) throw new Error('حدد مستودع الاستلام قبل اعتماد الحركة.');
      nextBalances[affectedWarehouse] = Number(nextBalances[affectedWarehouse] || 0) + quantity;
    } else if (!isRetry && ['issue', 'sale', 'adjustment'].includes(String(movement.type))) {
      if (!affectedWarehouse) throw new Error('حدد مستودع الصرف قبل اعتماد الحركة.');
      const isDecrease = movement.type === 'issue' || movement.type === 'sale' || movement.direction === 'decrease';
      const nextWarehouseQuantity = Number(nextBalances[affectedWarehouse] || 0) + (isDecrease ? -quantity : quantity);
      if (nextWarehouseQuantity < 0 && !database.settings.allowNegativeStock) {
        throw new Error(`لا يمكن اعتماد الصرف؛ رصيد ${item.name} في المستودع المحدد غير كافٍ.`);
      }
      nextBalances[affectedWarehouse] = nextWarehouseQuantity;
    } else if (!isRetry && movement.type === 'transfer') {
      if (!transferFrom || !transferTo || transferFrom === transferTo) throw new Error('يتطلب التحويل مستودري مصدر ووجهة مختلفين.');
      const sourceQuantity = Number(nextBalances[transferFrom] || 0);
      if (sourceQuantity < quantity && !database.settings.allowNegativeStock) throw new Error(`رصيد ${item.name} في مستودع المصدر لا يكفي للتحويل.`);
      nextBalances[transferFrom] = sourceQuantity - quantity;
      nextBalances[transferTo] = Number(nextBalances[transferTo] || 0) + quantity;
    }
    const nextItem = isRetry ? item : withUpdatedWarehouseBalances(item, nextBalances);
    if (!isRetry && nextItem.quantity < 0 && !database.settings.allowNegativeStock) throw new Error(`لا يمكن اعتماد الحركة؛ رصيد ${item.name} غير كافٍ.`);
    if (!isRetry && movement.type === 'purchase' && quantity > 0) {
      const oldValue = Number(item.quantity || 0) * Number(item.costPrice || 0);
      const incomingValue = quantity * Number(movement.unitCost || 0);
      nextItem.costPrice = Number(((oldValue + incomingValue) / Math.max(1, nextItem.quantity)).toFixed(4));
    }
    const approvedMovement = isRetry ? movement : { ...movement, unitCost, totalAmount, status: 'approved', statusLabel: movement.type === 'transfer' ? 'معتمد — تحويل داخلي' : 'معتمد — جارٍ ترحيل القيد' };
    await commitDatabase({
      ...database,
      items: isRetry ? database.items : database.items.map(row => row.id === item.id ? nextItem : row),
      movements: database.movements.map(row => row.id === movement.id ? approvedMovement : row)
    });
    notify(movement.type === 'transfer'
      ? `تم اعتماد التحويل ${movement.id} وتحديث رصيدي المصدر والوجهة. لا ينشأ قيد أستاذ عام للتحويل الداخلي بين مستودعات المدرسة.`
      : `تم اعتماد الحركة ${movement.id}؛ وحُفظت نتيجة الترحيل الكانوني مع مستند الحركة.`, 'success');
  };

  const handleApproveStocktake = async (stocktake: any) => {
    if (stocktake.status !== 'pending_approval') throw new Error('محضر الجرد ليس في حالة انتظار الاعتماد.');
    const item = database.items.find(row => row.id === stocktake.itemId);
    if (!item) throw new Error('الصنف المرتبط بمحضر الجرد غير موجود.');
    if (item.status === 'archived') throw new Error('لا يمكن اعتماد جرد لصنف مؤرشف.');
    const warehouseId = String(stocktake.warehouseId || item.warehouseId || '');
    const currentWarehouseQuantity = getItemWarehouseQuantity(item, warehouseId);
    if (Number(currentWarehouseQuantity) !== Number(stocktake.bookQty)) throw new Error('تغير رصيد المستودع الدفتري بعد إنشاء المحضر؛ أعد المطابقة قبل الاعتماد.');
    const discrepancy = Number(stocktake.actualQty) - Number(stocktake.bookQty);
    const financialImpact = roundInventoryMoney(discrepancy * Number(item.costPrice));
    if (!canApproveInventoryAmount(Math.abs(financialImpact), capabilities, database.procurementSettings)
      || (financialImpact !== 0 && !capabilities.financialWrite)) throw new Error('صلاحيات اعتماد الجرد أو الترحيل المالي غير متاحة.');
    const approvedStocktake = {
      ...stocktake,
      discrepancy, financialImpact, valuationUnitCost: Number(item.costPrice),
      status: 'approved',
      statusLabel: discrepancy === 0 ? 'معتمد — لا أثر مالي' : 'معتمد — جارٍ ترحيل التسوية'
    };
    await commitDatabase({
      ...database,
      items: database.items.map(row => {
        if (row.id !== item.id) return row;
        const balances = getItemWarehouseBalances(row);
        return withUpdatedWarehouseBalances(row, { ...balances, [warehouseId]: Number(stocktake.actualQty) });
      }),
      stocktakes: database.stocktakes.map(row => row.id === stocktake.id ? approvedStocktake : row)
    });
    notify(`تم اعتماد محضر الجرد ${stocktake.id} وتحديث رصيد الصنف؛ وسيظهر رقم قيد التسوية الكانوني عند نجاح الترحيل.`, 'success');
  };

  const handleNew = () => {
    setNewItemRequest(value => value + 1);
  };

  const handleSearch = () => {
    setSearchRequest(value => value + 1);
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

  const handleExportExcel = async (filteredItems: InventoryItem[]) => {
    try { await auditReport('csv'); } catch (error: any) {
      notify(error?.message || 'تعذر تدقيق تقرير المخزون قبل التصدير.', 'danger');
      return;
    }
    downloadCsv(`edupro_inventory_items_${Date.now()}.csv`, [
      ['رمز الصنف', 'اسم الصنف', 'معرف التصنيف', 'معرف وحدة القياس', 'معرف المورد', 'معرف المستودع', 'الحد الأدنى', 'الحد الأعلى', 'نقطة إعادة الطلب', 'تكلفة الوحدة', 'سعر البيع', 'الضريبة', 'الوصف'],
      ...filteredItems.map(item => [item.sku, item.name, item.categoryId, item.unitId, item.supplierId, item.warehouseId, item.minLevel, item.maxLevel, item.reorderLevel, item.costPrice, item.salePrice, item.vatRate, item.description])
    ]);
    notify('تم تدقيق دليل الأصناف وتصديره بصيغة CSV.', 'success');
  };

  const handleImportExcel = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,text/csv';
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      void (async () => {
        try {
          if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يتجاوز الحد الآمن وهو 10 ميغابايت.');
          const rows = parseCsvRows(await file.text());
          if (rows.length - 1 > 5000) throw new Error('يسمح باستيراد 5000 صنف كحد أقصى في الدفعة الواحدة.');
          const aliases: Record<string, string> = {
            'رمز الصنف': 'sku', 'اسم الصنف': 'name', 'معرف التصنيف': 'categoryid', 'معرف وحدة القياس': 'unitid',
            'معرف المورد': 'supplierid', 'معرف المستودع': 'warehouseid', 'الحد الأدنى': 'minlevel',
            'الحد الأعلى': 'maxlevel', 'نقطة إعادة الطلب': 'reorderlevel', 'تكلفة الوحدة': 'costprice',
            'سعر البيع': 'saleprice', 'الضريبة': 'vatrate', 'الوصف': 'description'
          };
          const normalizedHeaders = rows[0].map(value => aliases[value.trim()] || value.trim().toLowerCase());
          const column = (name: string) => normalizedHeaders.indexOf(name);
          for (const required of ['sku', 'name', 'categoryid', 'unitid', 'supplierid', 'warehouseid']) {
            if (column(required) < 0) throw new Error(`عمود إلزامي مفقود من قالب الاستيراد: ${required}`);
          }
          const usedSkus = new Set(items.map(item => item.sku.trim().toLowerCase()));
          const imported: InventoryItem[] = rows.slice(1).map((cells, rowIndex) => {
            const read = (name: string) => String(cells[column(name)] ?? '').trim();
            const sku = read('sku');
            const name = read('name');
            const categoryId = read('categoryid');
            const unitId = read('unitid');
            const supplierId = read('supplierid');
            const warehouseId = read('warehouseid');
            if (!sku || !name || !categoryId || !unitId || !supplierId || !warehouseId) throw new Error(`بيانات الصف ${rowIndex + 2} ناقصة في أحد الحقول الإلزامية.`);
            if (name.length < 2 || name.length > 200 || sku.length > 80) throw new Error(`اسم الصنف أو رمزه غير صالح في الصف ${rowIndex + 2}.`);
            if (usedSkus.has(sku.toLowerCase())) throw new Error(`رمز الصنف ${sku} مكرر في الملف أو موجود مسبقاً.`);
            if (!database.categories.some(category => category.id === categoryId) || !database.units.some(unit => unit.id === unitId)
              || !database.suppliers.some(supplier => supplier.id === supplierId) || !database.warehouses.some(warehouse => warehouse.id === warehouseId)) {
              throw new Error(`مراجع التصنيف أو الوحدة أو المورد أو المستودع في الصف ${rowIndex + 2} يجب أن تطابق المعرفات المسجلة.`);
            }
            usedSkus.add(sku.toLowerCase());
            const numeric = (field: string, integer = false) => {
              const raw = read(field);
              const value = raw === '' ? 0 : Number(raw);
              if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) throw new Error(`القيمة في عمود ${field} غير صالحة في الصف ${rowIndex + 2}.`);
              return value;
            };
            return {
              id: crypto.randomUUID(), schoolId: String(selectedSchool?.id || selectedSchool?.school_id || ''), branchId: String(selectedSchool?.branchId || ''),
              sku, name, categoryId, unitId, supplierId, warehouseId, quantity: 0, warehouseBalances: { [warehouseId]: 0 },
              minLevel: numeric('minlevel', true), maxLevel: numeric('maxlevel', true), reorderLevel: numeric('reorderlevel', true),
              costPrice: numeric('costprice'), salePrice: numeric('saleprice'), vatRate: numeric('vatrate'), description: read('description'),
              status: 'active', inventoryAccountId: '', costOfGoodsAccountId: '', adjustmentAccountId: '', costCenterId: ''
            };
          });
          if (imported.length === 0) throw new Error('لا توجد سجلات أصناف صالحة للاستيراد.');
          await updateCollection('items', [...items, ...imported]);
          notify(`تم التحقق وحفظ ${imported.length} بطاقة صنف مركزياً. الكميات تبدأ بصفر ويجب إدخالها بمستند مخزني.`, 'success');
        } catch (error: any) {
          notify(error?.message || 'تعذر استيراد ملف الأصناف.', 'danger');
        }
      })();
    };
    fileInput.click();
  };

  const handleDownloadTemplate = () => {
    downloadCsv('edupro_inventory_import_template.csv', [[
      'رمز الصنف', 'اسم الصنف', 'معرف التصنيف', 'معرف وحدة القياس', 'معرف المورد', 'معرف المستودع',
      'الحد الأدنى', 'الحد الأعلى', 'نقطة إعادة الطلب', 'تكلفة الوحدة', 'سعر البيع', 'الضريبة', 'الوصف'
    ]]);
    notify('تم تنزيل قالب CSV فارغ؛ استخدم معرفات الأدلة المسجلة. لا يستورد القالب أرصدة افتتاحية.', 'info');
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
    <InventoryPrintProvider schoolName={selectedSchool?.name || selectedSchool?.school_name || ''} version={checkedAt ? version : null} notify={notify}>
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" id="inventory-portal">
      <EnterpriseActionToolbar 
        title="إدارة المخزون والمستودعات المؤسسية (Inventory & Warehouse Control)"
        onNew={activeTab === 'items' ? handleNew : undefined}
        onSearch={activeTab === 'items' ? handleSearch : undefined}
        onImportExcel={activeTab === 'items' ? handleImportExcel : undefined}
        onDownloadTemplate={activeTab === 'items' ? handleDownloadTemplate : undefined}
        exportExcelLabel="CSV"
        importExcelLabel="استيراد CSV"
        onRefresh={() => { void loadDatabase().catch(() => undefined); }}
        isLoading={isLoading || isSaving}
        onExit={onExit}
      />
      {!checkedAt && <p role="alert">الكتابة متوقفة حتى ينجح تحميل المصدر المركزي.</p>}
      {snapshot.unknownSave && <div role="alert" className="p-4 bg-amber-50">نتيجة الحفظ غير محسومة؛ احتُفظ بالنموذج ومعرف العملية.
        <button disabled={isLoading || isSaving} onClick={() => { void snapshot.recover().then(() => setFormEpoch(value => value + 1)).catch(error => notify(error.message, 'warning')); }}>التحقق من نتيجة الحفظ</button>
        <button disabled={isLoading || isSaving} onClick={() => { void snapshot.retryPending().then(() => setFormEpoch(value => value + 1)).catch(error => notify(error.message, 'warning')); }}>إعادة محاولة العملية نفسها</button>
      </div>}
      
      <div className="flex flex-1 overflow-hidden" id="inventory-content">
        <nav className="w-64 shrink-0 border border-[#d4af37]/40 bg-[#2a1d13]/95 p-1.5 shadow-inner overflow-y-auto" id="inventory-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                  : 'text-amber-200/80 hover:text-white hover:bg-white/5'
              }`}
              id={`tab-${tab.id}`}
            >
              <tab.icon className="w-5 h-5 ml-3" />
              {tab.name}
            </button>
          ))}
        </nav>
        
        <main className="flex-1 overflow-y-auto p-8" id="inventory-main">
          <fieldset key={formEpoch} disabled={isLoading || isSaving || snapshot.unknownSave || !checkedAt} className="min-w-0">
          {activeTab === 'dashboard' && (
            <InventoryDashboard 
              items={items} 
              warehouses={database.warehouses}
              movements={database.movements}
              receipts={database.goodsReceipts}
              onNavigateTab={(tab, filter) => { setItemStatusFilter(filter || 'ALL'); setActiveTab(tab); }}
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
              newItemRequest={newItemRequest}
              searchRequest={searchRequest}
              onNewRequestHandled={() => setNewItemRequest(0)}
              onSearchRequestHandled={() => setSearchRequest(0)}
              initialStatusFilter={itemStatusFilter}
              onExportCSV={handleExportExcel}
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
            <StockMovementManager items={items} warehouses={database.warehouses} movements={database.movements} onSave={async movements => updateCollection('movements', movements)} onApproveMovement={handleApproveMovement} capabilities={capabilities} approvalSettings={database.procurementSettings} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'stocktakes' && (
            <StockCountManager items={items} warehouses={database.warehouses} stocktakes={database.stocktakes}
              onSave={async stocktakes => updateCollection('stocktakes', stocktakes)} onApproveStocktake={handleApproveStocktake} capabilities={capabilities} approvalSettings={database.procurementSettings} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'procurement' && (
            <ProcurementManagementPortal selectedSchool={selectedSchool} triggerNotification={triggerNotification}
              database={database} canonicalVersion={versionRef.current} onCommit={commitDatabase} onRefresh={loadDatabase} isLoading={isLoading || isSaving} capabilities={capabilities} />
          )}

          {activeTab === 'reports' && (
            <InventoryReports items={items} movements={database.movements} receipts={database.goodsReceipts} stocktakes={database.stocktakes} warehouses={database.warehouses} units={database.units} canonicalVersion={versionRef.current} triggerNotification={triggerNotification} />
          )}

          {activeTab === 'audit' && (
            <EnterpriseInventoryQualityAudit checkedAt={checkedAt} version={version} schoolName={selectedSchool?.name} />
          )}

          {activeTab === 'settings' && (
            <InventorySettings settings={database.settings} canEdit={capabilities.settings === true} onSave={async settings => updateCollection('settings', settings)} triggerNotification={triggerNotification} />
          )}
          </fieldset>
        </main>
      </div>
    </div>
    </InventoryPrintProvider>
  );
}
