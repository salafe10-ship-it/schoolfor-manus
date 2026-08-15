import React, { useState } from 'react';
import { 
  Warehouse, MapPin, UserCheck, Layers, Plus, 
  Edit, Trash2, CheckCircle2, AlertTriangle, 
  Building2, HardDrive, ShieldCheck, Search
} from 'lucide-react';
import { InventoryWarehouse } from '../../types';

interface WarehouseManagementProps {
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function WarehouseManagement({ triggerNotification }: WarehouseManagementProps) {
  const [warehouses, setWarehouses] = useState<InventoryWarehouse[]>([
    { id: 'branch_1_1', schoolId: 'school_1', name: 'المستودع الرئيسي العام', location: 'المبنى الرئيسي - القبو A1', manager: 'أ. يحيى بن معجب الشهري' },
    { id: 'branch_1_2', schoolId: 'school_1', name: 'مستودع الكتب والقرطاسية', location: 'مجمع البنات - الطابق الأول B2', manager: 'أ. مريم العتيبي' },
    { id: 'branch_1_3', schoolId: 'school_1', name: 'مستودع الأثاث والتجهيزات', location: 'الورشة المركزية - مستودع C3', manager: 'أ. إبراهيم الهذلي' },
    { id: 'branch_1_4', schoolId: 'school_1', name: 'مستودع المختبرات والتقنية', location: 'معامل العلوم والتكنولوجيا D4', manager: 'د. خالد الزهراني' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWh, setEditingWh] = useState<Partial<InventoryWarehouse> | null>(null);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWh || !editingWh.name) return;

    if (editingWh.id) {
      setWarehouses(warehouses.map(w => w.id === editingWh.id ? (editingWh as InventoryWarehouse) : w));
      notify(`✓ تم تحديث بيانات المستودع (${editingWh.name}) بنجاح`, 'success');
    } else {
      const newWh: InventoryWarehouse = {
        id: `wh_${Date.now()}`,
        schoolId: 'school_1',
        name: editingWh.name || '',
        location: editingWh.location || 'المبنى الرئيسي',
        manager: editingWh.manager || 'أمين المستودع'
      };
      setWarehouses([...warehouses, newWh]);
      notify(`✓ تم إضافة المستودع الجديد (${newWh.name}) بنجاح`, 'success');
    }
    setShowAddModal(false);
    setEditingWh(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-amber-600" /> إدارة المستودعات والمواقع والأرفف
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">تحديد المستودعات المعتمدة، توزيع الأرفف والممرات، وتعيين أمناء المخازن المسئولين قانونياً</p>
        </div>

        <button 
          onClick={() => {
            setEditingWh({ name: '', location: '', manager: '' });
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> إضافة مستودع جديد
        </button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map((wh) => (
          <div key={wh.id} className="p-6 hover:border-slate-300 transition space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md font-mono text-xs font-bold inline-block mb-1">
                  {wh.id}
                </span>
                <h4 className="text-lg font-black text-slate-900">{wh.name}</h4>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setEditingWh(wh);
                    setShowAddModal(true);
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-bold">الموقع الجغرافي:</span>
                <span>{wh.location}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">أمناء المستودع المسئولين:</span>
                <span className="font-semibold text-slate-900">{wh.manager}</span>
              </div>
            </div>

            {/* Sub-locations / Racks Preview */}
            <div className="bg-transparent p-3 border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-500 block">الأرفف والأقسام الفرعية المعتمدة:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md font-mono font-bold text-slate-700">رف A1-01</span>
                <span className="px-2.5 py-1 rounded-md font-mono font-bold text-slate-700">رف A1-02</span>
                <span className="px-2.5 py-1 rounded-md font-mono font-bold text-slate-700">رف B2-05</span>
                <span className="px-2.5 py-1 rounded-md font-mono font-bold text-slate-700">ممر الأجهزة C</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && editingWh && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-lg w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              {editingWh.id ? 'تعديل بيانات المستودع' : 'إضافة مستودع جديد بالمنظومة'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستودع باللغة العربية *</label>
                <input 
                  type="text"
                  required
                  value={editingWh.name || ''}
                  onChange={(e) => setEditingWh({ ...editingWh, name: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
                  placeholder="مثال: مستودع الأدوات والمختبرات"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">موقع المستودع المبنى/القسم</label>
                <input 
                  type="text"
                  required
                  value={editingWh.location || ''}
                  onChange={(e) => setEditingWh({ ...editingWh, location: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
                  placeholder="مثال: المبنى B - القبو رقم 2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم أمين المستودع المسؤول</label>
                <input 
                  type="text"
                  required
                  value={editingWh.manager || ''}
                  onChange={(e) => setEditingWh({ ...editingWh, manager: e.target.value })}
                  className="w-full p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-slate-900"
                  placeholder="مثال: أ. يحيى الشهري"
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
                  حفظ المستودع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
