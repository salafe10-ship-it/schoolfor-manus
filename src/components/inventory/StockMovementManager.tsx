import React, { useState } from 'react';
import { 
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Plus, 
  CheckCircle2, Clock, XCircle, FileText, Printer, 
  Search, Filter, Building2, Package, Calendar, User, ShieldCheck 
} from 'lucide-react';
import { InventoryTransaction, InventoryItem } from '../../types';

interface StockMovementManagerProps {
  items: InventoryItem[];
  movements?: any[];
  onSave?: (movements: any[]) => Promise<void>;
  onApproveMovement?: (movement: any) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function StockMovementManager({ items, movements = [], onSave, onApproveMovement, triggerNotification }: StockMovementManagerProps) {

  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMovement, setNewMovement] = useState<any>({
    type: 'purchase',
    itemId: '',
    warehouseFrom: '',
    warehouseTo: '',
    quantity: 0,
    unitCost: 0,
    notes: '',
    refNo: ''
  });

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find(i => i.id === newMovement.itemId);
    if (!selectedItem || !Number.isInteger(newMovement.quantity) || newMovement.quantity <= 0 || !Number.isFinite(newMovement.unitCost) || newMovement.unitCost < 0 || !newMovement.refNo) {
      notify('يرجى إدخال الصنف والكمية والتكلفة والمرجع بصورة صحيحة', 'warning');
      return;
    }
    const unitPrice = newMovement.unitCost;
    const totalVal = newMovement.quantity * unitPrice;

    const created: any = {
      id: `MV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: newMovement.type,
      typeLabel: newMovement.type === 'purchase' ? 'إضافة مخزنية (استلام)' :
                 newMovement.type === 'sale' ? 'صرف مخزني' : 'تحويل بين المستودعات',
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      warehouseFrom: newMovement.warehouseFrom,
      warehouseTo: newMovement.warehouseTo,
      quantity: newMovement.quantity,
      unitCost: unitPrice,
      totalAmount: totalVal,
      status: 'pending_approval',
      statusLabel: 'قيد المراجعة والاعتماد',
      createdBy: 'المستخدم الحالي',
      refNo: newMovement.refNo
    };

    if (!onSave) { notify('تسجيل الحركة متوقف حتى يتوفر المصدر المركزي.', 'warning'); return; }
    try {
      await onSave([created, ...movements]);
      notify(`✓ تم تسجيل حركة المخزون رقم (${created.id}) مركزياً وقيد المراجعة`, 'success');
      setShowNewModal(false);
    } catch (error: any) { notify(error?.message || 'تعذر حفظ الحركة مركزياً', 'danger'); }
  };

  const handlePostMovement = async (mv: any) => {
    if (mv.status !== 'approved') {
      notify('لا يمكن ترحيل الحركة قبل اعتمادها من الجهة المخولة', 'warning');
      return;
    }
    if (!onApproveMovement) { notify('لا يتوفر مسار إعادة ترحيل مركزي لهذه الحركة.', 'warning'); return; }
    try {
      await onApproveMovement(mv);
      notify(`تمت إعادة محاولة الترحيل الكانوني للحركة ${mv.id}.`, 'success');
    } catch (error: any) { notify(error?.message || 'تعذرت إعادة محاولة ترحيل الحركة.', 'danger'); }
  };

  const handleApprove = async (mv: any) => {
    if (!onApproveMovement) { notify('لا يتوفر مسار اعتماد مركزي لهذه الحركة.', 'warning'); return; }
    try { await onApproveMovement(mv); }
    catch (error: any) { notify(error?.message || 'تعذر اعتماد الحركة وترحيلها.', 'danger'); }
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
                      {mv.status === 'pending_approval' && (
                        <button 
                          onClick={() => { void handleApprove(mv); }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                        >
                          اعتماد وترحيل
                        </button>
                      )}
                      {mv.status === 'approved' && mv.type !== 'transfer' && (
                        <button
                          onClick={() => { void handlePostMovement(mv); }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                        >
                          إعادة الترحيل
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
                  onChange={(e) => { const item = items.find(row => row.id === e.target.value); setNewMovement({ ...newMovement, itemId: e.target.value, unitCost: item?.costPrice ?? newMovement.unitCost }); }}
                  className="w-full p-2.5 bg-transparent text-sm font-bold"
                >
                  <option value="">اختر الصنف</option>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تكلفة الوحدة للترحيل المحاسبي *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newMovement.unitCost}
                  onChange={(e) => setNewMovement({ ...newMovement, unitCost: Number(e.target.value) })}
                  className="w-full p-2.5 bg-transparent text-sm font-bold text-center"
                />
                <p className="text-[11px] text-slate-500 mt-1">تُستخدم القيمة لبناء قيد المخزون/تكلفة الصرف عند اعتماد الحركة.</p>
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
