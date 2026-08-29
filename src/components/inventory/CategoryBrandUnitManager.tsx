import React, { useState } from 'react';
import { Tag, Tags, Ruler, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { InventoryCategory, InventoryUnit } from '../../types';

interface CategoryBrandUnitManagerProps {
  categories: InventoryCategory[];
  brands: Array<{ id: string; name: string; origin?: string }>;
  units: InventoryUnit[];
  onSave: (patch: Partial<{ categories: InventoryCategory[]; brands: Array<{ id: string; name: string; origin?: string }>; units: InventoryUnit[] }>) => Promise<void>;
  triggerNotification?: (msg: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function CategoryBrandUnitManager({ categories, brands, units, onSave, triggerNotification }: CategoryBrandUnitManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'brands' | 'units'>('categories');
  const [newName, setNewName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const notify = (msg: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info') => {
    if (triggerNotification) triggerNotification(msg, type);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) { notify('الاسم مطلوب.', 'warning'); return; }
    try {
      if (activeSubTab === 'categories') await onSave({ categories: [...categories, { id: `cat_${Date.now()}`, schoolId: '', name, description: '' }] });
      if (activeSubTab === 'brands') await onSave({ brands: [...brands, { id: `brand_${Date.now()}`, name, origin: '' }] });
      if (activeSubTab === 'units') await onSave({ units: [...units, { id: `unit_${Date.now()}`, schoolId: '', name, symbol: name }] });
      notify(`✓ تم حفظ (${name}) مركزياً`, 'success');
      setNewName(''); setShowCreateForm(false);
    } catch (error: any) { notify(error?.message || 'تعذر الحفظ المركزي', 'danger'); }
  };

  const openCreateForm = () => { setNewName(''); setShowCreateForm(true); };

  return (
    <div className="space-y-6">
      {/* Sub tabs switcher */}
      <div className="p-4 flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'categories' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <Tag className="w-4 h-4" /> الفئات والتصنيفات ({categories.length})
        </button>

        <button 
          onClick={() => setActiveSubTab('brands')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'brands' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <Tags className="w-4 h-4" /> العلامات التجارية ({brands.length})
        </button>

        <button 
          onClick={() => setActiveSubTab('units')}
          className={`px-5 py-2.5 font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'units' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'bg-transparent text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'
          }`}
        >
          <Ruler className="w-4 h-4" /> وحدات القياس ({units.length})
        </button>
      </div>

      {/* Categories View */}
      {activeSubTab === 'categories' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">دليل التصنيفات الفنية للأصناف</h4>
            <button 
              onClick={openCreateForm}
              className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة تصنيف
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 bg-transparent space-y-2">
                <span className="text-xs font-mono font-bold text-amber-600">{cat.id}</span>
                <h5 className="font-black text-slate-900 text-base">{cat.name}</h5>
                <p className="text-xs text-slate-500">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands View */}
      {activeSubTab === 'brands' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">دليل العلامات التجارية والماركات</h4>
            <button 
              onClick={openCreateForm}
              className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة علامة تجارية
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div key={b.id} className="p-4 bg-transparent space-y-1">
                <h5 className="font-black text-slate-900 text-base">{b.name}</h5>
                <p className="text-xs text-slate-500">بلد المنشأ: {b.origin}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units View */}
      {activeSubTab === 'units' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base">دليل وحدات القياس المعتمدة</h4>
            <button 
              onClick={openCreateForm}
              className="px-4 py-2 bg-[#2a1d13] text-[#fce79a] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> إضافة وحدة قياس
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {units.map((u) => (
              <div key={u.id} className="p-4 bg-transparent text-center space-y-1">
                <span className="text-xs font-mono font-bold text-slate-400 block">{u.id}</span>
                <h5 className="font-black text-slate-900 text-lg">{u.name}</h5>
                <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded text-xs font-bold">{u.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white p-6 w-full max-w-md space-y-4" dir="rtl">
            <h3 className="font-black text-lg">{activeSubTab === 'categories' ? 'إضافة تصنيف' : activeSubTab === 'brands' ? 'إضافة علامة تجارية' : 'إضافة وحدة قياس'}</h3>
            <label className="block text-xs font-bold">الاسم *</label>
            <input autoFocus required value={newName} onChange={event => setNewName(event.target.value)} className="w-full p-2.5 border border-slate-300" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-slate-100">إلغاء</button><button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold">حفظ مركزياً</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
