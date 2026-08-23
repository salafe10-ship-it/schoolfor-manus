import React, { useState } from 'react';
import { 
  ShoppingBag, Plus, CheckCircle2, XCircle, Clock, 
  Search, Filter, Edit, Printer, Send, Truck, 
  AlertCircle, ShieldCheck, FileCheck, Layers 
} from 'lucide-react';
import { PurchaseOrder, ProcurementItemLine, PurchaseOrderStatus } from '../../types';

interface PurchaseOrderManagerProps {
  orders: PurchaseOrder[];
  onSaveOrder: (po: PurchaseOrder) => void;
  onReceiveItems: (po: PurchaseOrder) => void;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function PurchaseOrderManager({
  orders,
  onSaveOrder,
  onReceiveItems,
  triggerNotification
}: PurchaseOrderManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingPO, setEditingPO] = useState<Partial<PurchaseOrder> | null>(null);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleOpenNew = () => {
    setEditingPO({
      poNo: '',
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      vendorId: '',
      vendorName: '',
      warehouseId: '',
      paymentTerms: '',
      deliveryTerms: '',
      status: 'draft',
      lines: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      grandTotal: 0
    });
    setShowModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPO || !editingPO.poNo) {
      notify('يرجى إدخال رقم أمر الشراء قبل الحفظ', 'warning');
      return;
    }
    if (!editingPO.vendorId || !editingPO.warehouseId || !editingPO.lines?.length) {
      notify('لا يمكن حفظ أمر شراء دون مورد ومستودع وبند واحد على الأقل', 'warning');
      return;
    }

    const poToSave: PurchaseOrder = {
      id: editingPO.id || `po_${Date.now()}`,
      schoolId: 'school_1',
      poNo: editingPO.poNo,
      poDate: editingPO.poDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: editingPO.expectedDeliveryDate || new Date().toISOString().split('T')[0],
      vendorId: editingPO.vendorId,
      vendorName: editingPO.vendorName || '',
      warehouseId: editingPO.warehouseId,
      paymentTerms: editingPO.paymentTerms || '',
      deliveryTerms: editingPO.deliveryTerms || '',
      status: editingPO.status as PurchaseOrderStatus || 'draft',
      lines: editingPO.lines || [],
      subtotal: editingPO.subtotal ?? 0,
      taxAmount: editingPO.taxAmount ?? 0,
      discountAmount: editingPO.discountAmount ?? 0,
      grandTotal: editingPO.grandTotal ?? 0,
      createdAt: editingPO.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveOrder(poToSave);
    notify(`✓ تم حفظ وإصدار أمر الشراء رقم (${poToSave.poNo}) بنجاح`, 'success');
    setShowModal(false);
    setEditingPO(null);
  };

  const filtered = orders.filter(po => {
    const matchStatus = filterStatus === 'ALL' || po.status === filterStatus;
    const matchSearch = po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6" id="purchase-order-manager">
      {/* Top Header Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" /> أوامر الشراء الرسمية والعقود (Purchase Orders - PO)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">إصدار أوامر التوريد للموردين، تحديد الكميات، متابعة الاستلامات والالتزامات</p>
        </div>

        <button 
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> أصدار أمر شراء جديد (PO)
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم أمر الشراء، اسم المورد..." 
            className="w-full pr-10 pl-4 py-2 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-4 bg-transparent text-sm font-bold text-slate-800"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="approved">معتمد ومصدر</option>
          <option value="partially_received">مستلم جزئياً</option>
          <option value="fully_received">مستلم بالكامل</option>
          <option value="closed">مغلق</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#2a1d13] text-[#fce79a] font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-4">رقم الأمر</th>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">المورد المتعاقد</th>
                <th className="px-4 py-4">تاريخ التسليم المتوقع</th>
                <th className="px-4 py-4">إجمالي القيمة</th>
                <th className="px-4 py-4">حالة الاستلام والتوريد</th>
                <th className="px-4 py-4 text-center">العمليات والتوريد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
              {filtered.map((po) => (
                <tr key={po.id} className="hover:bg-transparent transition">
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">{po.poNo}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">{po.poDate}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{po.vendorName}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-700">{po.expectedDeliveryDate}</td>
                  <td className="px-4 py-4 font-black text-emerald-700">{po.grandTotal.toLocaleString('ar-SA')} د.ل</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                      po.status === 'fully_received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      po.status === 'partially_received' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {po.status === 'fully_received' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                      {po.status === 'fully_received' ? 'مستلم بالكامل' : po.status === 'partially_received' ? 'مستلم جزئياً' : 'جاهز للاستلام'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => onReceiveItems(po)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" /> إنشاء إذن استلام وفحص (GRN)
                      </button>

                      <button 
                        onClick={() => window.print()}
                        className="p-1.5 text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50 rounded-lg transition"
                        title="طباعة أمر الشراء"
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

      {/* Modal Form */}
      {showModal && editingPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" /> إصدار أمر شراء رسمي (Purchase Order)
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم أمر الشراء *</label>
                  <input 
                    type="text"
                    required
                    value={editingPO.poNo || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, poNo: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد المتعاقد *</label>
                  <input 
                    type="text"
                    required
                    value={editingPO.vendorName || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, vendorName: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التوريد المتوقع *</label>
                  <input 
                    type="date"
                    required
                    value={editingPO.expectedDeliveryDate || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, expectedDeliveryDate: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شروط التسليم والضمان</label>
                  <input 
                    type="text"
                    value={editingPO.deliveryTerms || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, deliveryTerms: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شروط الدفع المالي</label>
                  <input 
                    type="text"
                    value={editingPO.paymentTerms || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, paymentTerms: e.target.value })}
                    className="w-full p-2.5 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-700">
                  إجمالي قيمة أمر الشراء المعتمد: <strong className="text-emerald-700 text-lg">{(editingPO.grandTotal || 0).toLocaleString('ar-SA')} د.ل</strong>
                </span>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm shadow-sm"
                  >
                    حفظ وإصدار أمر الشراء
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
