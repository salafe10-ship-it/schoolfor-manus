import React, { useState } from 'react';
import { Truck, Phone, Mail, MapPin, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { InventorySupplier } from '../../types';

interface SupplierManagerProps {
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function SupplierManager({ triggerNotification }: SupplierManagerProps) {
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([
    { id: 'sup_sony', schoolId: 'school_1', name: 'شركة سوني العالمية - التوريدات التعليمية', phone: '+966 11 445 8899', email: 'education@sony.com.sa', address: 'طريق الملك فهد - الرياض' },
    { id: 'sup_local', schoolId: 'school_1', name: 'مؤسسة الرياض للأثاث المدرسي والتجهيزات', phone: '+966 11 223 9900', email: 'sales@riyadhfurniture.sa', address: 'حي الملز - الصناعية الأولى' },
    { id: 'sup_publish', schoolId: 'school_1', name: 'دار النشر العالمية للمناهج البريطانية', phone: '+966 12 600 4455', email: 'orders@globalbooks.com', address: 'طريق المدينة - جدة' },
    { id: 'sup_sci', schoolId: 'school_1', name: 'مؤسسة الأجهزة العلمية والمختبرات المتقدمة', phone: '+966 13 881 2233', email: 'lab@scitech.com.sa', address: 'طريق الظهران - الخبر' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSup, setNewSup] = useState<Partial<InventorySupplier>>({
    name: '', phone: '', email: '', address: ''
  });

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSup.name) return;

    const created: InventorySupplier = {
      id: `sup_${Date.now()}`,
      schoolId: 'school_1',
      name: newSup.name,
      phone: newSup.phone || '+966 11 000 0000',
      email: newSup.email || 'info@supplier.sa',
      address: newSup.address || 'الرياض'
    };

    setSuppliers([...suppliers, created]);
    notify(`✓ تم تسجيل المورد الجديد (${created.name}) بنجاح`, 'success');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" /> سجل الموردين والشركات التوريدية
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">بيانات الموردين المعتمدين، عناوين التواصل، وعقود التوريد المخزني</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> إضافة مورد جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((sup) => (
          <div key={sup.id} className="p-6 space-y-4 hover:border-slate-300 transition">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded mb-1 inline-block">{sup.id}</span>
              <h4 className="text-lg font-black text-slate-900">{sup.name}</h4>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">الهاتف:</span>
                <span className="font-mono text-slate-800">{sup.phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-600" />
                <span className="font-bold">البريد الإلكتروني:</span>
                <span className="font-mono text-slate-800">{sup.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span className="font-bold">العنوان الرسمية:</span>
                <span>{sup.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-lg w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">تسجيل مورد معتمد جديد</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد / الشركة *</label>
                <input 
                  type="text"
                  required
                  value={newSup.name}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm"
                  placeholder="مثال: شركة الخليج للتجهيزات المدرسية"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input 
                  type="text"
                  required
                  value={newSup.phone}
                  onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm font-mono"
                  placeholder="+966 11 000 0000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email"
                  value={newSup.email}
                  onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm font-mono"
                  placeholder="info@supplier.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان والموقع الجغرافي</label>
                <input 
                  type="text"
                  value={newSup.address}
                  onChange={(e) => setNewSup({ ...newSup, address: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm"
                  placeholder="الرياض - حي العليا"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm shadow-sm"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
