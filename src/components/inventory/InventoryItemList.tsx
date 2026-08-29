import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, 
  Check, X, FileSpreadsheet, AlertTriangle, 
  Package, Tag, Warehouse, Image as ImageIcon, 
  ArrowUpDown, Layers, Lock, ShieldCheck, DollarSign
} from 'lucide-react';
import { InventoryCategory, InventoryItem, InventorySupplier, InventoryUnit, InventoryWarehouse } from '../../types';

interface InventoryItemListProps {
  items: InventoryItem[];
  categories: InventoryCategory[];
  units: InventoryUnit[];
  suppliers: InventorySupplier[];
  warehouses: InventoryWarehouse[];
  onAddItem: (item: Partial<InventoryItem>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function InventoryItemList({
  items,
  categories,
  units,
  suppliers,
  warehouses,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  triggerNotification
}: InventoryItemListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  // Filtered List
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesWarehouse = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse;
    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'LOW' ? item.quantity <= item.minLevel :
      statusFilter === 'ZERO' ? item.quantity === 0 :
      item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
  });

  const handleOpenNewModal = () => {
    if (!categories.length || !units.length || !suppliers.length || !warehouses.length) {
      notify('يلزم تسجيل تصنيف ووحدة قياس ومورد ومستودع مركزي قبل إضافة صنف.', 'warning');
      return;
    }
    setEditingItem({
      schoolId: '',
      branchId: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      categoryId: categories[0].id,
      unitId: units[0].id,
      supplierId: suppliers[0].id,
      warehouseId: warehouses[0].id,
      quantity: 0,
      minLevel: 0,
      maxLevel: 0,
      reorderLevel: 0,
      costPrice: 0,
      salePrice: 0,
      vatRate: 0,
      status: 'active',
      inventoryAccountId: '',
      costOfGoodsAccountId: '',
      adjustmentAccountId: '',
      costCenterId: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item: InventoryItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || editingItem.name.trim().length < 2) {
      notify('يرجى إدخال اسم صنف فاخر وصحيح لا يقل عن حرفين', 'warning');
      return;
    }

    try {
      if (editingItem.id) {
        await onUpdateItem(editingItem.id, editingItem);
        notify(`✓ تم تحديث الصنف (${editingItem.name}) بنجاح`, 'success');
      } else {
        await onAddItem(editingItem);
        notify(`✓ تم إضافة الصنف الجديد (${editingItem.name}) إلى بطاقات الأصناف بنجاح`, 'success');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      notify(`خطأ في حفظ الصنف: ${err.message}`, 'danger');
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`هل أنت تأكد من إحالة الصنف (${item.name}) إلى الأرشيف النهائي؟`)) {
      try {
        await onDeleteItem(item.id);
        notify(`✓ تم أرشفة/حذف الصنف (${item.name}) من المخزون بنجاح`, 'success');
      } catch (err: any) {
        notify(`فشل حذف الصنف: ${err.message}`, 'danger');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Filter Bar */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-600" /> دليل وبطاقات الأصناف المخزنية
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">إدارة كافة بطاقات المواد والأصول الاستهلاكية والقرطاسية بالتفصيل المحاسبي</p>
          </div>

          <button 
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة صنف جديد
          </button>
        </div>

        {/* Search & Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالكود، الاسم، SKU..." 
              className="w-full pr-10 pl-4 py-2 bg-transparent text-sm focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-transparent text-sm focus:ring-2 focus:ring-slate-900 focus:font-semibold"
            >
              <option value="ALL">جميع الفئات والتصنيفات</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>

          <div>
            <select 
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full py-2 px-3 bg-transparent text-sm focus:ring-2 focus:ring-slate-900 focus:font-semibold"
            >
              <option value="ALL">جميع المستودعات</option>
              {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </div>

          <div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-transparent text-sm focus:ring-2 focus:ring-slate-900 focus:font-semibold"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="active">نشط ومتاح</option>
              <option value="LOW">⚠️ أصناف منخفضة (حد الطلب)</option>
              <option value="ZERO">🛑 أصناف صفرية (منتهية)</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-5 py-4">كود الصنف / SKU</th>
                <th className="px-5 py-4">اسم الصنف</th>
                <th className="px-5 py-4">التصنيف</th>
                <th className="px-5 py-4 text-center">الكمية الحالية</th>
                <th className="px-5 py-4 text-center">حد إعادة الطلب</th>
                <th className="px-5 py-4">تكلفة الصنف</th>
                <th className="px-5 py-4">سعر البيع/الصرف</th>
                <th className="px-5 py-4">الحالة</th>
                <th className="px-5 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-base">لا توجد أصناف مطابقة لمعايير البحث الحالية</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minLevel;
                  const isZero = item.quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">
                        {item.sku || item.id}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-xs text-slate-400 block font-mono">
                          {item.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                          {categories.find(category => category.id === item.categoryId)?.name || 'تصنيف غير متاح'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black inline-block ${
                          isZero ? 'bg-red-100 text-red-800 border border-red-200' :
                          isLow ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-500">
                        {item.minLevel}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {item.costPrice.toLocaleString('ar-SA')} د.ل
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {item.salePrice.toLocaleString('ar-SA')} د.ل
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status === 'active' ? 'نشط' : 'مؤرشف'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button 
                            onClick={() => handleOpenViewModal(item)}
                            title="معاينة تفاصيل بطاقة الصنف"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(item)}
                            title="تعديل البيانات"
                            className="p-2 text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
                            title="حذف الصنف"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / New Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="p-6 bg-[#2a1d13] text-[#fce79a] flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                {editingItem.id ? 'تعديل بيانات بطاقة الصنف' : 'إنشاء وتأكيد بطاقة صنف جديدة'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-6">
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider border-b border-amber-100 pb-1">البيانات الأساسية للصنف</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف باللغة العربية *</label>
                    <input 
                      type="text" 
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
                      placeholder="مثال: أجهزة بروجكتور سوني UHD"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كود الصنف / SKU *</label>
                    <input 
                      type="text" 
                      required
                      value={editingItem.sku || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                      className="w-full p-2.5 bg-transparent text-sm font-mono focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الفني</label>
                    <select 
                      value={editingItem.categoryId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                      className="w-full p-2.5 bg-transparent text-sm font-semibold focus:ring-2 focus:ring-slate-900"
                    >
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المستودع الرئيسي الافتراضي</label>
                    <select 
                      value={editingItem.warehouseId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, warehouseId: e.target.value })}
                      className="w-full p-2.5 bg-transparent text-sm font-semibold focus:ring-2 focus:ring-slate-900"
                    >
                      {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Quantities & Thresholds */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider border-b border-amber-100 pb-1">الكميات وحدود الأمان المخزني</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الكمية الافتتاحية</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editingItem.quantity || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-transparent text-sm font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى (حد الطلب)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editingItem.minLevel || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, minLevel: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-200 text-sm font-bold text-center text-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأعلى للمخزون</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editingItem.maxLevel || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, maxLevel: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-transparent text-sm font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نقطة إعادة الطلب</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editingItem.reorderLevel || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, reorderLevel: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-transparent text-sm font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Financial & Pricing */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-1">الأسعار والربط المحاسبي مع الأستاذ العام</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تكلفة الشراء للصنف (التكلفة الفردية)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={editingItem.costPrice || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-transparent text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع / الصرف المعتمد</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={editingItem.salePrice || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={editingItem.vatRate || 15}
                      onChange={(e) => setEditingItem({ ...editingItem, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-transparent text-sm font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> حفظ الصنف بالمخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Details Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-2xl w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600 uppercase block">{viewingItem.sku}</span>
                <h3 className="text-xl font-black text-slate-900">{viewingItem.name}</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-transparent p-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-bold">الكمية الحالية:</span>
                <span className="font-black text-slate-900 text-base">{viewingItem.quantity} قطعة</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">حد الطلب الأدنى:</span>
                <span className="font-bold text-amber-700 text-base">{viewingItem.minLevel}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">سعر التكلفة الفردية:</span>
                <span className="font-bold text-slate-800">{viewingItem.costPrice} د.ل</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">إجمالي التقييم:</span>
                <span className="font-black text-emerald-700">{(viewingItem.quantity * viewingItem.costPrice).toLocaleString('ar-SA')} د.ل</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">حساب أصل المخزون:</span>
                <span className="font-mono text-xs font-bold text-slate-700">{viewingItem.inventoryAccountId || 'غير مربوط'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">حساب تكلفة المبيعات/الصرف:</span>
                <span className="font-mono text-xs font-bold text-slate-700">{viewingItem.costOfGoodsAccountId || 'غير مربوط'}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 bg-[#2a1d13] text-[#fce79a] font-bold text-sm rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
