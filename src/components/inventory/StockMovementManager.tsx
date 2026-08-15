import React, { useState } from 'react';
import { 
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Plus, 
  CheckCircle2, Clock, XCircle, FileText, Printer, 
  Search, Filter, Building2, Package, Calendar, User, ShieldCheck 
} from 'lucide-react';
import { InventoryTransaction, InventoryItem } from '../../types';

interface StockMovementManagerProps {
  items: InventoryItem[];
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function StockMovementManager({ items, triggerNotification }: StockMovementManagerProps) {
  const [movements, setMovements] = useState<any[]>([
    {
      id: 'MV-2026-001',
      date: '2026-08-02',
      type: 'purchase',
      typeLabel: 'إضافة مخزنية (استلام توريد)',
      itemId: 'inv_item_1',
      itemName: 'أجهزة بروجكتور فائقة الجودة سوني UHD',
      warehouseFrom: '-',
      warehouseTo: 'المستودع الرئيسي - الرياض',
      quantity: 15,
      unitCost: 3000,
      totalAmount: 45000,
      status: 'posted',
      statusLabel: 'مرحل للأستاذ العام',
      createdBy: 'أمين المستودع (سليمان)',
      refNo: 'PO-99481'
    },
    {
      id: 'MV-2026-002',
      date: '2026-08-02',
      type: 'sale',
      typeLabel: 'صرف مخزني (قسم البنين)',
      itemId: 'inv_item_2',
      itemName: 'مقاعد دراسية مدمجة بخشب طبيعي',
      warehouseFrom: 'المستودع الرئيسي - الرياض',
      warehouseTo: 'مبنى ثانوي البنين',
      quantity: 40,
      unitCost: 200,
      totalAmount: 8000,
      status: 'posted',
      statusLabel: 'مرحل للأستاذ العام',
      createdBy: 'منصور (المدير المالي)',
      refNo: 'REQ-1004'
    },
    {
      id: 'MV-2026-003',
      date: '2026-08-01',
      type: 'transfer',
      typeLabel: 'تحويل بين المستودعات',
      itemId: 'inv_item_3',
      itemName: 'كتب المناهج البريطانية المعتمدة للأطفال',
      warehouseFrom: 'المستودع الرئيسي',
      warehouseTo: 'مستودع الكتب والقرطاسية',
      quantity: 100,
      unitCost: 50,
      totalAmount: 5000,
      status: 'approved',
      statusLabel: 'معتمد وفي انتظار الترحيل',
      createdBy: 'مشرف المستودعات',
      refNo: 'TRF-3001'
    }
  ]);

  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMovement, setNewMovement] = useState<any>({
    type: 'purchase',
    itemId: items[0]?.id || 'inv_item_1',
    warehouseFrom: 'branch_1_1',
    warehouseTo: 'branch_1_2',
    quantity: 5,
    unitCost: 100,
    notes: '',
    refNo: `REF-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find(i => i.id === newMovement.itemId) || items[0];
    const unitPrice = selectedItem ? selectedItem.costPrice : newMovement.unitCost;
    const totalVal = newMovement.quantity * unitPrice;

    const created: any = {
      id: `MV-2026-00${movements.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      type: newMovement.type,
      typeLabel: newMovement.type === 'purchase' ? 'إضافة مخزنية (استلام)' :
                 newMovement.type === 'sale' ? 'صرف مخزني' : 'تحويل بين المستودعات',
      itemId: selectedItem ? selectedItem.id : 'inv_item_1',
      itemName: selectedItem ? selectedItem.name : 'صنف مخزني',
      warehouseFrom: newMovement.type === 'purchase' ? '-' : 'المستودع الرئيسي',
      warehouseTo: newMovement.type === 'sale' ? '-' : 'مستودع الأثاث',
      quantity: newMovement.quantity,
      unitCost: unitPrice,
      totalAmount: totalVal,
      status: 'approved',
      statusLabel: 'معتمد وجاهز للترحيل المحاسبي',
      createdBy: 'مدير الحركة المالي',
      refNo: newMovement.refNo
    };

    setMovements([created, ...movements]);
    notify(`✓ تم تسجيل حركة المخزون رقم (${created.id}) بنجاح`, 'success');
    setShowNewModal(false);
  };

  const handlePostMovement = (mv: any) => {
    setMovements(movements.map(m => m.id === mv.id ? { ...m, status: 'posted', statusLabel: 'مرحل للأستاذ العام' } : m));
    notify(`✓ تم ترحيل الأثر المالي للحركة رقم (${mv.id}) إلى قيد اليومية العامة وقاعدة البيانات بنجاح`, 'success');
  };

  const filtered = movements.filter(m => {
    const matchType = filterType === 'ALL' || m.type === filterType;
    const matchSearch = m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-600" /> إدارة الحركات والتحويلات المخزنية
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">توثيق إذن الإضافة، إذن الصرف، وإذونات التحويل بين المستودعات والترحيل المحاسبي</p>
        </div>

        <button 
          onClick={() => setShowNewModal(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> إنشاء إذن حركة جديد
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الحركة، اسم الصنف..." 
            className="w-full pr-10 pl-4 py-2 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="py-2 px-4 bg-transparent text-sm font-bold text-slate-800"
        >
          <option value="ALL">جميع أنواع الحركات</option>
          <option value="purchase">إضافة مخزنية (استلام)</option>
          <option value="sale">صرف مخزني</option>
          <option value="transfer">تحويل بين مستودعات</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-5 py-4">رقم الحركة</th>
                <th className="px-5 py-4">التاريخ</th>
                <th className="px-5 py-4">نوع الحركة</th>
                <th className="px-5 py-4">الصنف المخزني</th>
                <th className="px-5 py-4 text-center">الكمية</th>
                <th className="px-5 py-4">إجمالي القيمة</th>
                <th className="px-5 py-4">الحالة والترحيل</th>
                <th className="px-5 py-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filtered.map((mv) => (
                <tr key={mv.id} className="hover:bg-transparent transition">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{mv.id}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold text-xs">{mv.date}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">
                    <span className={`px-2.5 py-1 rounded-lg text-xs ${
                      mv.type === 'purchase' ? 'bg-emerald-100 text-emerald-800' :
                      mv.type === 'sale' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {mv.typeLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">{mv.itemName}</td>
                  <td className="px-5 py-4 text-center font-black text-slate-900">{mv.quantity}</td>
                  <td className="px-5 py-4 font-bold text-emerald-700">{mv.totalAmount.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                      mv.status === 'posted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {mv.statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {mv.status !== 'posted' && (
                        <button 
                          onClick={() => handlePostMovement(mv)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                        >
                          ترحيل محاسبي
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          window.print();
                          notify(`تم إرسال إذن الحركة (${mv.id}) للطباعة الرسمية`, 'info');
                        }}
                        className="p-1.5 text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50 rounded-lg transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Movement Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-lg w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-600" /> إضافة إذن حركة مخزنية جديد
            </h3>

            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة *</label>
                <select 
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm font-bold"
                >
                  <option value="purchase">إضافة مخزنية (استلام توريد)</option>
                  <option value="sale">صرف مخزني (استهلاك/تسليم)</option>
                  <option value="transfer">تحويل بين مستودعين</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصنف المخزني *</label>
                <select 
                  value={newMovement.itemId}
                  onChange={(e) => setNewMovement({ ...newMovement, itemId: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm font-bold"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (الكمية المتاحة: {i.quantity})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية *</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-transparent text-sm font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم المرجع / الإذن</label>
                  <input 
                    type="text"
                    required
                    value={newMovement.refNo}
                    onChange={(e) => setNewMovement({ ...newMovement, refNo: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm shadow-sm"
                >
                  تأكيد الإذن وحفظ الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
