import React, { useState } from 'react';
import { 
  Warehouse, MapPin, UserCheck, Layers, Plus, 
  Edit, Trash2, CheckCircle2, AlertTriangle, 
  Building2, HardDrive, ShieldCheck, Search
} from 'lucide-react';
import { InventoryWarehouse, InventoryWarehouseLocation, InventoryWarehouseLocationType } from '../../types';
import { INVENTORY_WAREHOUSE_LOCATION_TYPES, validateWarehouseLocations } from '../../modules/inventory/domain/WarehouseLocationValidation';

interface WarehouseManagementProps {
  warehouses?: InventoryWarehouse[];
  onSave?: (warehouses: InventoryWarehouse[]) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function WarehouseManagement({ warehouses = [], onSave, triggerNotification }: WarehouseManagementProps) {

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWh, setEditingWh] = useState<Partial<InventoryWarehouse> | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationWarehouseId, setLocationWarehouseId] = useState('');
  const [editingLocation, setEditingLocation] = useState<Partial<InventoryWarehouseLocation> | null>(null);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWh || !editingWh.name?.trim() || !editingWh.location?.trim() || !editingWh.manager?.trim()) {
      notify('اسم المستودع والموقع وأمين المستودع حقول مطلوبة وموثقة', 'warning');
      return;
    }

    if (!onSave) { notify('حفظ المستودع متوقف حتى يتوفر المصدر المركزي.', 'warning'); return; }
    try {
      if (editingWh.id) {
        await onSave(warehouses.map(w => w.id === editingWh.id ? (editingWh as InventoryWarehouse) : w));
        notify(`✓ تم تحديث بيانات المستودع (${editingWh.name}) مركزياً`, 'success');
      } else {
      const newWh: InventoryWarehouse = {
        id: `wh_${Date.now()}`,
        schoolId: '',
        name: editingWh.name || '',
        location: editingWh.location.trim(),
        manager: editingWh.manager.trim()
      };
        await onSave([...warehouses, newWh]);
        notify(`✓ تم إضافة المستودع الجديد (${newWh.name}) مركزياً`, 'success');
      }
      setShowAddModal(false);
      setEditingWh(null);
    } catch (error: any) { notify(error?.message || 'تعذر حفظ المستودع مركزياً', 'danger'); }
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
    setLocationWarehouseId('');
    setEditingLocation(null);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const warehouse = warehouses.find(row => row.id === locationWarehouseId);
    if (!warehouse || !editingLocation) return;
    const location: InventoryWarehouseLocation = {
      id: editingLocation.id || `loc_${Date.now()}`,
      code: String(editingLocation.code || '').trim(),
      name: String(editingLocation.name || '').trim(),
      type: (editingLocation.type || 'storage') as InventoryWarehouseLocationType,
      ...(String(editingLocation.parentId || '').trim() ? { parentId: String(editingLocation.parentId).trim() } : {}),
      ...(editingLocation.capacity !== undefined && editingLocation.capacity !== null && editingLocation.capacity !== ''
        ? { capacity: Number(editingLocation.capacity) } : {}),
      ...(editingLocation.blocked ? { blocked: true, blockedReason: String(editingLocation.blockedReason || '').trim() } : {})
    };
    const locations = warehouse.locations || [];
    const nextLocations = location.id && locations.some(row => row.id === location.id)
      ? locations.map(row => row.id === location.id ? location : row)
      : [...locations, location];
    try {
      const validatedLocations = validateWarehouseLocations(nextLocations, `المستودع ${warehouse.name}`);
      if (!onSave) throw new Error('حفظ الموقع متوقف حتى يتوفر المصدر المركزي.');
      await onSave(warehouses.map(row => row.id === warehouse.id ? { ...row, locations: validatedLocations } : row));
      notify(`✓ تم حفظ الموقع ${location.code} داخل المستودع ${warehouse.name}`, 'success');
      closeLocationModal();
    } catch (error: any) {
      notify(error?.message || 'تعذر حفظ موقع المستودع مركزياً', 'danger');
    }
  };

  const openNewLocation = (warehouseId: string) => {
    setLocationWarehouseId(warehouseId);
    setEditingLocation({ type: 'storage', blocked: false });
    setShowLocationModal(true);
  };

  const openEditLocation = (warehouseId: string, location: InventoryWarehouseLocation) => {
    setLocationWarehouseId(warehouseId);
    setEditingLocation({ ...location });
    setShowLocationModal(true);
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

            {/* Internal locations */}
            <div className="bg-transparent p-3 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-500">المواقع الداخلية والأرفف المعتمدة:</span>
                <button
                  type="button"
                  onClick={() => openNewLocation(wh.id)}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg"
                >
                  <Plus className="w-3 h-3 inline-block ml-1" /> إضافة موقع
                </button>
              </div>
              {wh.locations?.length ? (
                <div className="space-y-1.5">
                  {wh.locations.map(location => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => openEditLocation(wh.id, location)}
                      className="w-full flex items-center justify-between gap-3 text-right px-2.5 py-2 bg-white/60 hover:bg-amber-50 rounded-lg border border-slate-100"
                    >
                      <span className="min-w-0">
                        <span className="font-mono text-[11px] font-black text-slate-700">{location.code}</span>
                        <span className="block text-xs font-bold text-slate-900 truncate">{location.name}</span>
                      </span>
                      <span className={`text-[10px] font-bold whitespace-nowrap ${location.blocked ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {location.blocked ? 'محظور' : 'متاح'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">لا توجد مواقع داخلية موثقة لهذا المستودع بعد.</div>
              )}
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

      {showLocationModal && editingLocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="shadow-2xl max-w-lg w-full p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div>
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">توثيق موقع داخلي</h3>
              <p className="text-xs text-slate-500 mt-2">الموقع الداخلي يحدد خانة الاستلام أو التخزين أو الالتقاط داخل المستودع.</p>
            </div>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز الموقع *</label>
                  <input type="text" required value={editingLocation.code || ''} onChange={e => setEditingLocation({ ...editingLocation, code: e.target.value.toUpperCase() })} className="w-full p-2.5 bg-transparent text-sm font-mono" placeholder="A-01-01" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموقع *</label>
                  <input type="text" required value={editingLocation.name || ''} onChange={e => setEditingLocation({ ...editingLocation, name: e.target.value })} className="w-full p-2.5 bg-transparent text-sm" placeholder="رف الأدوات" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الموقع *</label>
                  <select value={editingLocation.type || 'storage'} onChange={e => setEditingLocation({ ...editingLocation, type: e.target.value as InventoryWarehouseLocationType })} className="w-full p-2.5 bg-transparent text-sm font-bold">
                    {INVENTORY_WAREHOUSE_LOCATION_TYPES.map(type => <option key={type} value={type}>{({ receiving: 'استلام', storage: 'تخزين', picking: 'التقاط', dispatch: 'صرف/تسليم', quarantine: 'حجر/فحص' } as Record<string, string>)[type]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع الأب</label>
                  <select value={editingLocation.parentId || ''} onChange={e => setEditingLocation({ ...editingLocation, parentId: e.target.value || undefined })} className="w-full p-2.5 bg-transparent text-sm">
                    <option value="">بدون موقع أب</option>
                    {(warehouses.find(row => row.id === locationWarehouseId)?.locations || []).filter(row => row.id !== editingLocation.id).map(row => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعة الاختيارية</label>
                  <input type="number" min="0.01" step="0.01" value={editingLocation.capacity ?? ''} onChange={e => setEditingLocation({ ...editingLocation, capacity: e.target.value ? Number(e.target.value) : undefined })} className="w-full p-2.5 bg-transparent text-sm" placeholder="مثال: 100" />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 pb-2">
                  <input type="checkbox" checked={Boolean(editingLocation.blocked)} onChange={e => setEditingLocation({ ...editingLocation, blocked: e.target.checked })} /> الموقع محظور مؤقتاً
                </label>
              </div>
              {editingLocation.blocked && <div><label className="block text-xs font-bold text-slate-700 mb-1">سبب الحظر *</label><input type="text" required value={editingLocation.blockedReason || ''} onChange={e => setEditingLocation({ ...editingLocation, blockedReason: e.target.value })} className="w-full p-2.5 bg-transparent text-sm" placeholder="صيانة أو فحص سلامة" /></div>}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeLocationModal} className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-sm rounded-xl">حفظ الموقع</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
